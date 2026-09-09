/**
 * The ledger: one row for every dollar that moved.
 *
 * A single categorised list, not double-entry. What the accountant needs at
 * the end of the year is every transaction with a date, an amount, a category
 * that already maps to the return, and a receipt on the expenses. That is
 * what this stores, and nothing cleverer.
 *
 * Rows are grouped by month in the database because that is the only way they
 * are ever read: this month on the phone, one month on the ledger page, the
 * year for the reports. A row that came from somewhere else (an ad payment,
 * later Stripe or the bank) carries a `sourceRef`, and the same reference can
 * never be posted twice.
 */

import { randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "@/lib/ads/redis";
import { categoryOf, isCategoryId } from "./categories";
import { isIsoDate } from "./money";

export type { Account, Direction, EntryKind } from "./kinds";
export { ACCOUNTS, KINDS, accountLabel, isAccount, kindOf } from "./kinds";
import { isAccount, kindOf, type Account, type Direction, type EntryKind } from "./kinds";

export type EntrySource = "manual" | "ads" | "stripe" | "bank" | "recurring";

export type Entry = {
  id: string;
  /** YYYY-MM-DD, the day the money moved. */
  date: string;
  /** Whole cents, always positive. `direction` says which way. */
  cents: number;
  direction: Direction;
  kind: EntryKind;
  category: string;
  account: Account;
  /** On a transfer: where the money went. A withdrawal is checking → cash. */
  toAccount?: Account;
  /** Who paid, or who was paid. */
  party: string;
  /** A Books client, when the money came from one. */
  clientId?: string;
  /** Whose money, on a contribution or a draw. */
  partner?: string;
  receiptId?: string;
  /** Set when there is deliberately no receipt (a bank fee, a Zelle in). Stops the nag. */
  noReceipt?: boolean;
  memo: string;
  who: string;
  source: EntrySource;
  /** Where it came from, when not typed: "ads:payment:<id>", "recurring:<id>:<month>", "stripe:txn:<id>". */
  sourceRef?: string;
  /** The Stripe balance transaction this row is, or was matched to. */
  stripeRef?: string;
  /** Other outside records that point at this same row: an ad payment matched to a Stripe charge. */
  links?: string[];
  createdAt: string;
  updatedAt: string;
};

export type EntryInput = Omit<Entry, "id" | "createdAt" | "updatedAt" | "direction"> & { direction?: Direction };

const KEY = (id: string) => `books:entry:${id}`;
const MONTH = (month: string) => `books:entries:${month}`;
const MONTHS = "books:months";
const SOURCE = (ref: string) => `books:source:${ref}`;

export const monthOf = (date: string) => date.slice(0, 7);

/* ------------------------------- validation ------------------------------- */

/** Null when it can save; otherwise the sentence to show. */
export function validateEntry(input: EntryInput): string | null {
  const kind = kindOf(input.kind);
  if (!kind) return "Pick what kind of money this is.";
  if (!Number.isInteger(input.cents) || input.cents <= 0) return "How much? Enter an amount greater than zero.";
  if (!isIsoDate(input.date)) return "When? Give the date the money moved.";
  if (!isCategoryId(input.category)) return "Pick a category.";
  if (categoryOf(input.category).kind !== kind.category) return "That category doesn't fit that kind of entry.";
  if (!isAccount(input.account)) return "Which account did it go through?";
  if (kind.id === "transfer") {
    if (!input.toAccount || !isAccount(input.toAccount)) return "Where did the money go? Pick the account it moved to.";
    if (input.toAccount === input.account) return "A transfer needs two different accounts.";
  }
  if ((kind.id === "contribution" || kind.id === "draw") && !input.partner) return "Whose money is it? Pick Dessi or Jay.";
  if (!input.party && kind.id !== "contribution" && kind.id !== "draw" && kind.id !== "transfer") {
    return "Who was it from, or who was it to?";
  }
  return null;
}

/** The direction a kind implies. A transfer leaves `account` for `toAccount`. */
export function directionFor(kind: EntryKind, given?: Direction): Direction {
  return kindOf(kind)?.direction ?? given ?? "out";
}

/* -------------------------------- balances -------------------------------- */

/**
 * Where the money is, from every row ever logged.
 *
 * The books started the week the account opened, so this is the real
 * balance of each account as long as everything has been logged: money in
 * adds, money out subtracts, and a transfer subtracts from one account and
 * adds to the other. Cash on hand is the number people actually forget.
 */
export function accountBalances(entries: Entry[]): Record<Account, number> {
  const b: Record<Account, number> = { checking: 0, stripe: 0, cash: 0 };
  for (const e of entries) {
    if (e.kind === "transfer") {
      if (e.toAccount) {
        b[e.account] -= e.cents;
        b[e.toAccount] += e.cents;
      } else {
        // Older transfers only knew one side.
        b[e.account] += e.direction === "in" ? e.cents : -e.cents;
      }
      continue;
    }
    b[e.account] += e.direction === "in" ? e.cents : -e.cents;
  }
  return b;
}

/* --------------------------------- storage -------------------------------- */

function parse(raw: unknown): Entry | null {
  try {
    return raw ? (JSON.parse(String(raw)) as Entry) : null;
  } catch {
    return null;
  }
}

async function loadByIds(ids: string[]): Promise<Entry[]> {
  if (ids.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...ids.map(KEY)]]);
  return (Array.isArray(values) ? values : [])
    .map(parse)
    .filter((e): e is Entry => e !== null)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function getEntry(id: string): Promise<Entry | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  return parse(raw);
}

/** One month, newest first. */
export async function listEntries(month: string): Promise<Entry[]> {
  const [ids] = await redisPipeline([["SMEMBERS", MONTH(month)]]);
  return loadByIds(Array.isArray(ids) ? ids.map(String) : []);
}

/** Every month with at least one row, newest first. */
export async function listMonths(): Promise<string[]> {
  const [months] = await redisPipeline([["SMEMBERS", MONTHS]]);
  return (Array.isArray(months) ? months.map(String) : []).sort().reverse();
}

/** Everything ever, for the reports and the backup. */
export async function listAllEntries(): Promise<Entry[]> {
  const months = await listMonths();
  if (months.length === 0) return [];
  const idLists = await redisPipeline(months.map((m) => ["SMEMBERS", MONTH(m)]));
  const ids = idLists.flatMap((l) => (Array.isArray(l) ? l.map(String) : []));
  return loadByIds(ids);
}

const IGNORED = "ignored:";

export type SourceStatus = { kind: "entry"; entry: Entry } | { kind: "ignored"; reason: string } | null;

/** What the books have done with an outside record: posted it, left it out, or nothing yet. */
export async function sourceStatus(ref: string): Promise<SourceStatus> {
  if (!ref) return null;
  const [raw] = await redisPipeline([["GET", SOURCE(ref)]]);
  if (!raw) return null;
  const value = String(raw);
  if (value.startsWith(IGNORED)) return { kind: "ignored", reason: value.slice(IGNORED.length) };
  const entry = await getEntry(value);
  return entry ? { kind: "entry", entry } : null;
}

export async function entryBySource(ref: string): Promise<Entry | null> {
  const status = await sourceStatus(ref);
  return status?.kind === "entry" ? status.entry : null;
}

export type SourceMark = { kind: "entry"; entryId: string } | { kind: "ignored"; reason: string };

/** The same question for many references at once, one round trip, without loading the rows. */
export async function sourceStatuses(refs: string[]): Promise<Map<string, SourceMark | null>> {
  const out = new Map<string, SourceMark | null>();
  if (refs.length === 0) return out;
  const [values] = await redisPipeline([["MGET", ...refs.map(SOURCE)]]);
  refs.forEach((ref, i) => {
    const raw = Array.isArray(values) ? values[i] : null;
    if (!raw) return out.set(ref, null);
    const value = String(raw);
    out.set(ref, value.startsWith(IGNORED) ? { kind: "ignored", reason: value.slice(IGNORED.length) } : { kind: "entry", entryId: value });
  });
  return out;
}

/**
 * Point a second outside record at a row that already exists: an ad payment
 * and the Stripe charge that is the same money. The row remembers the link
 * so a later match can see it is already spoken for.
 */
export async function linkSource(ref: string, entryId: string): Promise<boolean> {
  const entry = await getEntry(entryId);
  if (!entry) return false;
  const links = Array.from(new Set([...(entry.links ?? []), ref]));
  return redisWrite([
    ["SET", SOURCE(ref), entryId],
    ["SET", KEY(entryId), JSON.stringify({ ...entry, links })],
  ]);
}

export async function unlinkSource(ref: string, entryId: string): Promise<boolean> {
  const entry = await getEntry(entryId);
  if (!entry) return redisWrite([["DEL", SOURCE(ref)]]);
  const links = (entry.links ?? []).filter((l) => l !== ref);
  return redisWrite([
    ["DEL", SOURCE(ref)],
    ["SET", KEY(entryId), JSON.stringify({ ...entry, links: links.length ? links : undefined })],
  ]);
}

/** Say an outside record is not business money, so it is never offered again. */
export async function ignoreSource(ref: string, reason: string): Promise<boolean> {
  return redisWrite([["SET", SOURCE(ref), `${IGNORED}${reason.slice(0, 160)}`]]);
}

export async function unignoreSource(ref: string): Promise<boolean> {
  const status = await sourceStatus(ref);
  if (status?.kind !== "ignored") return false;
  return redisWrite([["DEL", SOURCE(ref)]]);
}

export type SaveResult = { ok: true; entry: Entry } | { ok: false; error: string };

export async function addEntry(input: EntryInput): Promise<SaveResult> {
  const invalid = validateEntry(input);
  if (invalid) return { ok: false, error: invalid };

  // The same ad payment or bill must never land twice, and one that was
  // deliberately left out stays out.
  if (input.sourceRef) {
    const status = await sourceStatus(input.sourceRef);
    if (status?.kind === "entry") return { ok: true, entry: status.entry };
    if (status?.kind === "ignored") return { ok: false, error: `That was left out of the books on purpose: ${status.reason}.` };
  }

  const now = new Date().toISOString();
  const entry: Entry = {
    ...input,
    id: randomUUID().slice(0, 12),
    direction: directionFor(input.kind, input.direction),
    party: input.party.slice(0, 120),
    memo: input.memo.slice(0, 400),
    createdAt: now,
    updatedAt: now,
  };

  const commands: (string | number)[][] = [
    ["SET", KEY(entry.id), JSON.stringify(entry)],
    ["SADD", MONTH(monthOf(entry.date)), entry.id],
    ["SADD", MONTHS, monthOf(entry.date)],
  ];
  if (entry.sourceRef) commands.push(["SET", SOURCE(entry.sourceRef), entry.id]);

  const ok = await redisWrite(commands);
  return ok ? { ok: true, entry } : { ok: false, error: "The database didn't accept it." };
}

export async function updateEntry(id: string, patch: Partial<EntryInput>): Promise<SaveResult> {
  const current = await getEntry(id);
  if (!current) return { ok: false, error: "That entry isn't in the ledger any more." };

  const merged: Entry = {
    ...current,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  merged.direction = directionFor(merged.kind, patch.direction ?? current.direction);
  const invalid = validateEntry(merged);
  if (invalid) return { ok: false, error: invalid };
  merged.party = merged.party.slice(0, 120);
  merged.memo = merged.memo.slice(0, 400);

  const commands: (string | number)[][] = [["SET", KEY(id), JSON.stringify(merged)]];
  if (monthOf(merged.date) !== monthOf(current.date)) {
    commands.push(["SREM", MONTH(monthOf(current.date)), id]);
    commands.push(["SADD", MONTH(monthOf(merged.date)), id]);
    commands.push(["SADD", MONTHS, monthOf(merged.date)]);
  }
  const ok = await redisWrite(commands);
  return ok ? { ok: true, entry: merged } : { ok: false, error: "The database didn't accept it." };
}

export async function deleteEntry(id: string): Promise<Entry | null> {
  const entry = await getEntry(id);
  if (!entry) return null;
  const commands: (string | number)[][] = [
    ["DEL", KEY(id)],
    ["SREM", MONTH(monthOf(entry.date)), id],
  ];
  if (entry.sourceRef) {
    // An ad payment or a Stripe transaction removed by hand is a decision to
    // leave it out, or the next sync would put it straight back; a bill
    // removed by hand should simply come back as due.
    if (entry.source === "ads" || entry.source === "stripe") commands.push(["SET", SOURCE(entry.sourceRef), `${IGNORED}removed from the ledger`]);
    else commands.push(["DEL", SOURCE(entry.sourceRef)]);
  }
  // Anything else that pointed here now points at nothing.
  for (const ref of entry.links ?? []) commands.push(["DEL", SOURCE(ref)]);
  const ok = await redisWrite(commands);
  return ok ? entry : null;
}

/* --------------------------------- sums ----------------------------------- */

export type Totals = {
  income: number;
  expense: number;
  /** Income less expense. Owner money and transfers are left out on purpose. */
  net: number;
  contributions: number;
  draws: number;
  count: number;
};

export function totals(entries: Entry[]): Totals {
  const t: Totals = { income: 0, expense: 0, net: 0, contributions: 0, draws: 0, count: entries.length };
  for (const e of entries) {
    if (e.kind === "income") t.income += e.cents;
    else if (e.kind === "expense") t.expense += e.cents;
    else if (e.kind === "contribution") t.contributions += e.cents;
    else if (e.kind === "draw") t.draws += e.cents;
  }
  t.net = t.income - t.expense;
  return t;
}

/** What each partner has put in, less what they have taken out. */
export function capitalByPartner(entries: Entry[], partners: readonly string[]): { partner: string; contributed: number; drawn: number; net: number }[] {
  return partners.map((partner) => {
    const contributed = entries.filter((e) => e.kind === "contribution" && e.partner === partner).reduce((s, e) => s + e.cents, 0);
    const drawn = entries.filter((e) => e.kind === "draw" && e.partner === partner).reduce((s, e) => s + e.cents, 0);
    return { partner, contributed, drawn, net: contributed - drawn };
  });
}

/** Expenses typed by hand with nothing attached and nobody saying there is nothing to attach. */
export function missingReceipts(entries: Entry[]): Entry[] {
  return entries.filter((e) => e.kind === "expense" && e.source === "manual" && !e.receiptId && !e.noReceipt);
}

/** Totals by category, biggest first, for the month view. */
export function byCategory(entries: Entry[], kind: EntryKind): { category: string; label: string; cents: number; count: number }[] {
  const map = new Map<string, { cents: number; count: number }>();
  for (const e of entries) {
    if (e.kind !== kind) continue;
    const cur = map.get(e.category) ?? { cents: 0, count: 0 };
    cur.cents += e.cents;
    cur.count += 1;
    map.set(e.category, cur);
  }
  return [...map.entries()]
    .map(([category, v]) => ({ category, label: categoryOf(category).label, ...v }))
    .sort((a, b) => b.cents - a.cents);
}
