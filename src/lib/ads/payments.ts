/**
 * Money that has actually arrived.
 *
 * The roster knows what advertisers owe. Until now nothing knew what they had
 * paid, which was tolerable while that gap only affected your own picture of
 * the business — and stops being tolerable the moment a share of it is owed to
 * somebody else. The venue owner's cut is calculated on money collected, so
 * money collected has to be a recorded fact rather than a memory.
 *
 * Deliberately not an invoicing system. Invoices go out through Stripe; this
 * records that a payment landed, when, and against whom, which is the only part
 * the statement needs and the only part worth keeping in two places.
 */

import { randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "./redis";
import { postAdPayment, unpostAdPayment } from "@/lib/books/ads-bridge";

const KEY = (id: string) => `ads:payment:${id}`;
const BY_ADVERTISER = (advertiserId: string) => `ads:payments:${advertiserId}`;
/** Every payment received in one calendar month, for the statement. */
const BY_MONTH = (month: string) => `ads:payments:month:${month}`;

export type PaymentMethod = "stripe" | "cash" | "check" | "transfer" | "other";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "stripe", label: "Stripe" },
  { id: "cash", label: "Cash" },
  { id: "check", label: "Check" },
  { id: "transfer", label: "Bank transfer" },
  { id: "other", label: "Other" },
];

export type Payment = {
  id: string;
  advertiserId: string;
  /** Denormalised so a statement reads correctly even if a client is renamed. */
  business: string;
  amount: number;
  /** YYYY-MM-DD, the day the money arrived — not the day it was typed in. */
  receivedOn: string;
  method: PaymentMethod;
  /** Stripe payment id, cheque number, whatever identifies it. */
  reference: string;
  note: string;
  /**
   * The month this was meant to cover, YYYY-MM, when it was recorded against a
   * particular expected payment. Absent on older records and on money that
   * arrived without being matched to anything, which the schedule then
   * allocates oldest-first.
   */
  period?: string;
  recordedAt: string;
};

/** The calendar month a payment belongs to, e.g. "2026-08". */
export const monthOf = (receivedOn: string): string => receivedOn.slice(0, 7);

export function validatePayment(input: {
  amount: number;
  receivedOn: string;
}): string | null {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return "How much was it? Enter an amount greater than zero.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.receivedOn)) {
    return "When did it arrive? Give the date the money landed.";
  }
  return null;
}

/* -------------------------------- storage --------------------------------- */

function parse(raw: unknown): Payment | null {
  try {
    return raw ? (JSON.parse(String(raw)) as Payment) : null;
  } catch {
    return null;
  }
}

async function loadByIds(ids: string[]): Promise<Payment[]> {
  if (ids.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...ids.map(KEY)]]);
  return (Array.isArray(values) ? values : [])
    .map(parse)
    .filter((p): p is Payment => p !== null)
    .sort((a, b) => b.receivedOn.localeCompare(a.receivedOn));
}

export async function getPayment(id: string): Promise<Payment | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  return parse(raw);
}

export async function listPayments(advertiserId: string): Promise<Payment[]> {
  const [ids] = await redisPipeline([["SMEMBERS", BY_ADVERTISER(advertiserId)]]);
  return loadByIds(Array.isArray(ids) ? ids.map(String) : []);
}

/** Everything that arrived in one calendar month, across every client. */
export async function paymentsInMonth(month: string): Promise<Payment[]> {
  const [ids] = await redisPipeline([["SMEMBERS", BY_MONTH(month)]]);
  return loadByIds(Array.isArray(ids) ? ids.map(String) : []);
}

export type PaymentInput = {
  advertiserId: string;
  business: string;
  amount: number;
  receivedOn: string;
  method: PaymentMethod;
  reference: string;
  note: string;
  period?: string;
  /** Who recorded it, for the ledger row it posts. */
  who?: string;
};

export async function recordPayment(
  input: PaymentInput,
): Promise<{ ok: boolean; error?: string }> {
  const invalid = validatePayment(input);
  if (invalid) return { ok: false, error: invalid };

  const { who = "", ...fields } = input;
  const record: Payment = {
    ...fields,
    id: randomUUID(),
    amount: Math.round(input.amount * 100) / 100,
    reference: input.reference.slice(0, 120),
    note: input.note.slice(0, 300),
    recordedAt: new Date().toISOString(),
  };

  const ok = await redisWrite([
    ["SET", KEY(record.id), JSON.stringify(record)],
    ["SADD", BY_ADVERTISER(record.advertiserId), record.id],
    ["SADD", BY_MONTH(monthOf(record.receivedOn)), record.id],
  ]);

  if (!ok) return { ok: false, error: "The database didn't accept it." };

  // The same money, as income in the books. Keyed to this payment, so it can
  // never post twice and goes when the payment goes.
  await postAdPayment(record, who);
  return { ok: true };
}

export async function deletePayment(id: string): Promise<boolean> {
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  const payment = parse(raw);
  if (!payment) return false;

  const ok = await redisWrite([
    ["DEL", KEY(id)],
    ["SREM", BY_ADVERTISER(payment.advertiserId), id],
    ["SREM", BY_MONTH(monthOf(payment.receivedOn)), id],
  ]);
  if (ok) await unpostAdPayment(id);
  return ok;
}

/* --------------------------------- totals --------------------------------- */

export const sumPayments = (payments: Payment[]): number =>
  payments.reduce((total, p) => total + p.amount, 0);

export type PaymentStanding = {
  paid: number;
  /** Contracted value of the term minus what has been paid. Never negative. */
  outstanding: number;
  /** Paid more than the term is worth — usually a renewal landing early. */
  overpaid: number;
  lastPaidOn: string | null;
};

/**
 * Where a client stands against their contract.
 *
 * Compared against the whole term rather than a monthly schedule, because a
 * prepaid term is settled in one payment and an invoiced one arrives in pieces;
 * both end at the same number, and the difference between them is a question
 * about timing rather than about what is owed.
 */
export function standing(payments: Payment[], termValue: number): PaymentStanding {
  const paid = sumPayments(payments);
  return {
    paid,
    outstanding: Math.max(0, termValue - paid),
    overpaid: Math.max(0, paid - termValue),
    lastPaidOn: payments[0]?.receivedOn ?? null,
  };
}
