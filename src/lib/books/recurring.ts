/**
 * Bills that come every month: Vercel, Twilio, the domain, the phone.
 *
 * Nothing is posted automatically. A recurring bill is an expectation: on
 * its day each month it appears on the Today list, and one tap logs it with
 * the amount it usually is. If the charge never came, the row stays until
 * someone deals with it, which is the whole reason to write the bill down.
 */

import { randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "@/lib/ads/redis";
import { isCategoryId, categoryOf } from "./categories";
import { daysInMonth } from "./money";
import { isAccount, type Account, type Entry } from "./ledger";

export type RecurringBill = {
  id: string;
  vendor: string;
  cents: number;
  category: string;
  account: Account;
  /** 1 to 31. Clamped to the month's last day. */
  day: number;
  active: boolean;
  note: string;
  createdAt: string;
  createdBy: string;
};

const KEY = (id: string) => `books:recurring:${id}`;
const INDEX = "books:recurrings";

export const billSourceRef = (billId: string, month: string) => `recurring:${billId}:${month}`;

function parse(raw: unknown): RecurringBill | null {
  try {
    return raw ? (JSON.parse(String(raw)) as RecurringBill) : null;
  } catch {
    return null;
  }
}

export async function listBills(): Promise<RecurringBill[]> {
  const [ids] = await redisPipeline([["SMEMBERS", INDEX]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list.map(KEY)]]);
  return (Array.isArray(values) ? values : [])
    .map(parse)
    .filter((b): b is RecurringBill => b !== null)
    .sort((a, b) => a.day - b.day || a.vendor.localeCompare(b.vendor));
}

export async function getBill(id: string): Promise<RecurringBill | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  return parse(raw);
}

export function validateBill(input: { vendor: string; cents: number; category: string; account: string; day: number }): string | null {
  if (!input.vendor.trim()) return "Who is the bill from?";
  if (!Number.isInteger(input.cents) || input.cents <= 0) return "How much is it, usually?";
  if (!isCategoryId(input.category) || categoryOf(input.category).kind !== "expense") return "Pick an expense category.";
  if (!isAccount(input.account)) return "Which account does it come out of?";
  if (!Number.isInteger(input.day) || input.day < 1 || input.day > 31) return "What day of the month? 1 to 31.";
  return null;
}

export async function addBill(input: {
  vendor: string;
  cents: number;
  category: string;
  account: Account;
  day: number;
  note: string;
  who: string;
}): Promise<{ ok: boolean; error?: string }> {
  const invalid = validateBill(input);
  if (invalid) return { ok: false, error: invalid };
  const bill: RecurringBill = {
    id: randomUUID().slice(0, 8),
    vendor: input.vendor.trim().slice(0, 120),
    cents: input.cents,
    category: input.category,
    account: input.account,
    day: input.day,
    active: true,
    note: input.note.slice(0, 300),
    createdAt: new Date().toISOString(),
    createdBy: input.who,
  };
  const ok = await redisWrite([
    ["SET", KEY(bill.id), JSON.stringify(bill)],
    ["SADD", INDEX, bill.id],
  ]);
  return ok ? { ok: true } : { ok: false, error: "The database didn't accept it." };
}

export async function setBillActive(id: string, active: boolean): Promise<boolean> {
  const bill = await getBill(id);
  if (!bill) return false;
  return redisWrite([["SET", KEY(id), JSON.stringify({ ...bill, active })]]);
}

export async function deleteBill(id: string): Promise<boolean> {
  return redisWrite([
    ["DEL", KEY(id)],
    ["SREM", INDEX, id],
  ]);
}

/* -------------------------------- expected -------------------------------- */

export type ExpectedBill = {
  bill: RecurringBill;
  month: string;
  /** YYYY-MM-DD it is expected. */
  dueDate: string;
  status: "logged" | "due" | "upcoming";
  /** The ledger row, once logged. */
  entry?: Entry;
  daysLate: number;
};

/** A bill's date in a month, clamped so "the 31st" exists in September. */
export function billDueDate(bill: RecurringBill, month: string): string {
  const day = Math.min(bill.day, daysInMonth(month));
  return `${month}-${String(day).padStart(2, "0")}`;
}

/**
 * Every active bill for one month, with whether it has been logged.
 *
 * Logged means a ledger row exists with this bill's reference for this month,
 * which is what the Log button writes. Pure: hand it the month's entries.
 */
export function expectedBills(bills: RecurringBill[], entries: Entry[], month: string, today: string): ExpectedBill[] {
  const byRef = new Map(entries.filter((e) => e.sourceRef).map((e) => [e.sourceRef!, e]));
  return bills
    .filter((b) => b.active)
    .map((bill) => {
      const dueDate = billDueDate(bill, month);
      const entry = byRef.get(billSourceRef(bill.id, month));
      const late = dueDate < today ? Math.round((Date.parse(today) - Date.parse(dueDate)) / 86_400_000) : 0;
      return {
        bill,
        month,
        dueDate,
        status: entry ? "logged" : dueDate <= today ? "due" : "upcoming",
        entry,
        daysLate: entry ? 0 : late,
      } as ExpectedBill;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
