/**
 * Stripe, pulled into the ledger.
 *
 * Most clients pay through Stripe, so most of the income is already written
 * down somewhere: in Stripe. This reads it out rather than having anyone type
 * it twice. The unit is the balance transaction, Stripe's own ledger of every
 * movement in and out of the balance: a charge, its fee, a refund, a payout to
 * the bank. Each becomes the ledger rows it implies, keyed to the transaction
 * id so it can never post twice, and a run only asks for what has happened
 * since the last one.
 *
 * A charge posts at the gross amount, with the fee as its own expense, because
 * that is how the return wants it: gross receipts on one line, fees on
 * another. A payout is not income; it is the Stripe balance moving to the bank.
 *
 * The key is a restricted, read-only key. This code can look; it cannot
 * charge, refund or move money, and nothing here should ever need to.
 */

import { redisPipeline, redisWrite } from "@/lib/ads/redis";
import { localStamp } from "@/lib/ads/scan-store";
import { ensureClientForStripeCustomer } from "./clients";
import {
  addEntry,
  linkSource,
  listEntries,
  monthOf,
  sourceStatus,
  sourceStatuses,
  unignoreSource,
  updateEntry,
  type Entry,
  type EntryInput,
} from "./ledger";
import { shiftMonth } from "./money";

/** Stripe itself, unless a local stand-in is pointed at for testing. */
const API = (process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/$/, "") + "/v1";
/** The books opened with the bank account. Nothing before this is the LLC's. */
export const SYNC_FROM_DEFAULT = "2026-09-01";

const STATE_KEY = "books:stripe:state";
const TXNS = "books:stripe:txns";
const TXN = (id: string) => `books:stripe:txn:${id}`;
const RUNS_KEPT = 12;
/** A run re-reads this far back, so a transaction that arrived late is still seen. The reference guard stops any double. */
const OVERLAP_SECONDS = 3 * 86_400;
const MAX_PAGES = 20;
/** How far apart a typed-in Stripe payment and the real charge may be and still be the same money. */
const MATCH_WINDOW_DAYS = 7;

export const stripeRef = (txnId: string) => `stripe:txn:${txnId}`;
export const stripeFeeRef = (txnId: string) => `stripe:txn:${txnId}:fee`;

/* ------------------------------ configuration ----------------------------- */

function key(): string | null {
  const raw = process.env.STRIPE_RESTRICTED_KEY?.trim();
  return raw || null;
}

export function isStripeConfigured(): boolean {
  return key() !== null;
}

/** What kind of key is in use, never the key itself. */
export function describeStripeKey(): string {
  const raw = key();
  if (!raw) return "STRIPE_RESTRICTED_KEY is not set.";
  if (raw.startsWith("rk_live_")) return "Restricted live key, read only.";
  if (raw.startsWith("rk_test_")) return "Restricted TEST key. That is Stripe's sandbox, not your money. Swap it for the live one.";
  if (raw.startsWith("sk_")) return "That is a full secret key, not a restricted one. It works, but it can move money. Replace it with a read-only restricted key.";
  return "Set, but it doesn't look like a Stripe key.";
}

/** The first day the sync cares about. STRIPE_SYNC_FROM overrides, for a fresh start. */
export function syncFrom(): string {
  const raw = process.env.STRIPE_SYNC_FROM;
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : SYNC_FROM_DEFAULT;
}

/* --------------------------------- the API -------------------------------- */

type StripeList<T> = { object: "list"; data: T[]; has_more: boolean };
type StripeErrorBody = { error?: { message?: string; type?: string; code?: string } };

type Customer = { id: string; name?: string | null; email?: string | null; deleted?: boolean };
type Charge = {
  object: "charge";
  id: string;
  customer: string | Customer | null;
  billing_details?: { name?: string | null; email?: string | null };
  receipt_email?: string | null;
  description?: string | null;
  invoice?: string | null;
};
type Refund = { object: "refund"; id: string; charge: string | { id: string } | null; reason?: string | null };
type Payout = { object: "payout"; id: string; arrival_date: number; status: string; description?: string | null };
type Source = Charge | Refund | Payout | { object: string; id: string };

export type BalanceTransaction = {
  id: string;
  /** Signed cents. In is positive, out is negative. */
  amount: number;
  /** Cents Stripe kept. Positive on a charge, usually zero on a refund. */
  fee: number;
  net: number;
  currency: string;
  created: number;
  description: string | null;
  type: string;
  status: string;
  reporting_category?: string;
  source: string | Source | null;
};

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * One GET against Stripe. Reads the body on every answer: Stripe puts the
 * reason for a refusal in the body, and a 200 with an error object in it is
 * still a refusal.
 */
async function stripeGet<T>(path: string, params: Record<string, string | number | string[]> = {}): Promise<ApiResult<T>> {
  const k = key();
  if (!k) return { ok: false, error: "STRIPE_RESTRICTED_KEY is not set." };
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => query.append(`${name}[]`, v));
    else query.set(name, String(value));
  }
  const qs = query.toString();
  try {
    const res = await fetch(`${API}${path}${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${k}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json().catch(() => null)) as (T & StripeErrorBody) | null;
    if (!res.ok || !body || body.error) {
      const message = body?.error?.message || `Stripe answered ${res.status} with nothing useful in the body.`;
      return { ok: false, error: message.slice(0, 300) };
    }
    return { ok: true, data: body };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 300) : "Stripe didn't answer." };
  }
}

/** What Stripe is holding right now, in cents, for the page to set beside the books' own figure. */
export async function stripeBalance(): Promise<ApiResult<{ available: number; pending: number }>> {
  const res = await stripeGet<{ available: { amount: number; currency: string }[]; pending: { amount: number; currency: string }[] }>("/balance");
  if (!res.ok) return res;
  const usd = (rows: { amount: number; currency: string }[]) => rows.filter((r) => r.currency === "usd").reduce((s, r) => s + r.amount, 0);
  return { ok: true, data: { available: usd(res.data.available ?? []), pending: usd(res.data.pending ?? []) } };
}

async function fetchTransactionsSince(fromUnix: number): Promise<ApiResult<BalanceTransaction[]>> {
  const all: BalanceTransaction[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await stripeGet<StripeList<BalanceTransaction>>("/balance_transactions", {
      limit: 100,
      "created[gte]": fromUnix,
      expand: ["data.source"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    if (!res.ok) return res;
    all.push(...res.data.data);
    if (!res.data.has_more || res.data.data.length === 0) break;
    startingAfter = res.data.data[res.data.data.length - 1].id;
  }
  return { ok: true, data: all };
}

/* -------------------------------- records --------------------------------- */

export type StripeTxnState = "posted" | "matched" | "left-out" | "skipped";

/** What the books did with one balance transaction. */
export type StripeTxn = {
  id: string;
  type: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  created: number;
  /** The ledger date it was given. */
  date: string;
  party: string;
  description: string;
  customerId?: string;
  clientId?: string;
  state: StripeTxnState;
  entryId?: string;
  feeEntryId?: string;
  /** Why it was skipped, or what to look at. */
  note?: string;
  /** Not a charge, refund, fee or payout: someone should glance at it. */
  unusual?: boolean;
  syncedAt: string;
};

export type StripeRun = {
  at: string;
  who: string;
  ok: boolean;
  error?: string;
  /** From what date the run asked. */
  from: string;
  seen: number;
  posted: number;
  matched: number;
  /** Already in the books from an earlier run. */
  known: number;
  leftOut: number;
  skipped: number;
};

export type StripeState = {
  lastRunAt?: string;
  lastOk?: boolean;
  lastError?: string;
  /** The newest `created` seen, so the next run starts near there. */
  lastCreated?: number;
  runs: StripeRun[];
};

function parse<T>(raw: unknown): T | null {
  try {
    return raw ? (JSON.parse(String(raw)) as T) : null;
  } catch {
    return null;
  }
}

export async function getStripeState(): Promise<StripeState> {
  const [raw] = await redisPipeline([["GET", STATE_KEY]]);
  return parse<StripeState>(raw) ?? { runs: [] };
}

async function saveState(state: StripeState): Promise<boolean> {
  return redisWrite([["SET", STATE_KEY, JSON.stringify(state)]]);
}

async function saveTxn(txn: StripeTxn): Promise<void> {
  await redisWrite([
    ["SET", TXN(txn.id), JSON.stringify(txn)],
    ["ZADD", TXNS, txn.created, txn.id],
  ]);
}

export async function getStripeTxn(id: string): Promise<StripeTxn | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", TXN(id)]]);
  return parse<StripeTxn>(raw);
}

/** Newest first. */
export async function listStripeTxns(limit = 100): Promise<StripeTxn[]> {
  const [ids] = await redisPipeline([["ZREVRANGE", TXNS, 0, limit - 1]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list.map(TXN)]]);
  return (Array.isArray(values) ? values : []).map((v) => parse<StripeTxn>(v)).filter((t): t is StripeTxn => t !== null);
}

/**
 * A transaction's record says what the sync did. The ledger says what is
 * true now: a row can be removed by hand after the fact. This reads both, so
 * the page never claims a row is there when it isn't.
 */
export type StripeTxnView = StripeTxn & { now: StripeTxnState; reason?: string };

export async function stripeTxnViews(limit = 100): Promise<StripeTxnView[]> {
  // Ordered by the ledger date, so a payout sits on the day the bank got it.
  const txns = (await listStripeTxns(limit)).sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
  const statuses = await sourceStatuses(txns.map((t) => stripeRef(t.id)));
  return txns.map((t) => {
    const s = statuses.get(stripeRef(t.id));
    if (s?.kind === "ignored") return { ...t, now: "left-out", reason: s.reason };
    if (s?.kind === "entry") return { ...t, now: t.state === "matched" ? "matched" : "posted", entryId: s.entryId };
    return { ...t, now: t.state === "skipped" ? "skipped" : "left-out", reason: t.state === "skipped" ? t.note : "removed from the ledger" };
  });
}

/* --------------------------------- posting -------------------------------- */

const dateOf = (unix: number) => localStamp(new Date(unix * 1000)).date;
/** Payout arrival dates are midnight UTC on the day the bank gets it. */
const utcDateOf = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);

const isCharge = (s: unknown): s is Charge => typeof s === "object" && s !== null && (s as Source).object === "charge";
const isRefund = (s: unknown): s is Refund => typeof s === "object" && s !== null && (s as Source).object === "refund";
const isPayout = (s: unknown): s is Payout => typeof s === "object" && s !== null && (s as Source).object === "payout";

const INCOME_TYPES = new Set(["charge", "payment"]);
const REFUND_TYPES = new Set(["refund", "payment_refund", "payment_failure_refund"]);
const PAYOUT_TYPES = new Set(["payout"]);
const PAYOUT_BACK_TYPES = new Set(["payout_failure", "payout_cancel"]);
const FEE_TYPES = new Set(["stripe_fee", "stripe_fx_fee", "tax_fee"]);

/** Plain words for a Stripe type, for the page. */
export function describeType(type: string): string {
  if (INCOME_TYPES.has(type)) return "Payment";
  if (REFUND_TYPES.has(type)) return "Refund";
  if (PAYOUT_TYPES.has(type)) return "Payout";
  if (PAYOUT_BACK_TYPES.has(type)) return "Payout returned";
  if (FEE_TYPES.has(type)) return "Stripe fee";
  if (type === "adjustment") return "Adjustment";
  return type.replace(/_/g, " ");
}

async function customerName(id: string, names: Map<string, string>): Promise<string> {
  const cached = names.get(id);
  if (cached !== undefined) return cached;
  const res = await stripeGet<Customer>(`/customers/${id}`);
  const name = res.ok && !res.data.deleted ? (res.data.name || res.data.email || "").trim() : "";
  names.set(id, name);
  return name;
}

/** Who paid, and which client that is, from a charge. */
async function describeCharge(charge: Charge | null, fallback: string, names: Map<string, string>) {
  const customerId = charge ? (typeof charge.customer === "string" ? charge.customer : charge.customer?.id) : undefined;
  let name = "";
  if (charge && typeof charge.customer === "object" && charge.customer) name = (charge.customer.name || charge.customer.email || "").trim();
  if (!name && customerId) name = await customerName(customerId, names);
  if (!name) name = (charge?.billing_details?.name || charge?.receipt_email || "").trim();
  const party = name || fallback || "Stripe customer";

  let clientId: string | undefined;
  let category = "client-revenue";
  if (customerId) {
    const client = await ensureClientForStripeCustomer(customerId, party);
    if (client) {
      clientId = client.id;
      if (client.advertiserId) category = "ad-revenue";
    }
  }
  return { party, customerId, clientId, category };
}

/** The entries near a date, for matching. This month and the ones either side. */
async function entriesAround(date: string): Promise<Entry[]> {
  const month = monthOf(date);
  const lists = await Promise.all([shiftMonth(month, -1), month, shiftMonth(month, 1)].map((m) => listEntries(m)));
  return lists.flat();
}

const daysApart = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000;

/**
 * A Stripe payment somebody already typed in: an ad payment marked paid by
 * Stripe, or a row logged by hand against the Stripe account. Same amount,
 * within a week, not yet tied to a transaction. The closest one wins.
 */
async function findTypedEntry(cents: number, date: string): Promise<Entry | null> {
  const candidates = (await entriesAround(date)).filter(
    (e) => e.kind === "income" && e.account === "stripe" && e.cents === cents && !e.stripeRef && (e.source === "ads" || e.source === "manual") && daysApart(e.date, date) <= MATCH_WINDOW_DAYS,
  );
  candidates.sort((a, b) => daysApart(a.date, date) - daysApart(b.date, date));
  return candidates[0] ?? null;
}

async function post(input: EntryInput): Promise<{ entry: Entry | null; error?: string }> {
  const r = await addEntry(input);
  return r.ok ? { entry: r.entry } : { entry: null, error: r.error };
}

/** The fee on a transaction, as its own row. A negative fee is Stripe giving one back. */
async function postFee(t: BalanceTransaction, date: string, party: string, who: string): Promise<string | undefined> {
  if (!t.fee) return undefined;
  const r = await post({
    date,
    cents: Math.abs(t.fee),
    kind: t.fee > 0 ? "expense" : "income",
    category: t.fee > 0 ? "processing-fees" : "other-income",
    account: "stripe",
    party: "Stripe",
    memo: t.fee > 0 ? `Fee on ${party}` : `Fee returned on ${party}`,
    who,
    source: "stripe",
    sourceRef: stripeFeeRef(t.id),
    stripeRef: t.id,
    noReceipt: true,
  });
  return r.entry?.id;
}

/**
 * One balance transaction into the ledger. Returns the record of what
 * happened, which is also saved. Safe to call twice: the reference guard in
 * the ledger hands back the row that is already there.
 */
async function postTransaction(t: BalanceTransaction, who: string, names: Map<string, string>): Promise<StripeTxn> {
  const base: StripeTxn = {
    id: t.id,
    type: t.type,
    amount: t.amount,
    fee: t.fee,
    net: t.net,
    currency: t.currency,
    created: t.created,
    date: dateOf(t.created),
    party: "",
    description: (t.description ?? "").slice(0, 200),
    state: "skipped",
    syncedAt: new Date().toISOString(),
  };
  const finish = async (rec: StripeTxn) => {
    await saveTxn(rec);
    return rec;
  };
  const skip = (note: string, unusual = false) => finish({ ...base, state: "skipped", note, unusual });

  if (t.currency !== "usd") return skip(`Not in dollars (${t.currency}). Log it by hand at the converted amount.`, true);
  if (t.amount === 0 && t.fee === 0) return skip("Nothing moved.");

  const source = typeof t.source === "object" ? t.source : null;
  const memoTail = base.description ? `${base.description} · ${t.id}` : t.id;

  /* A payment in. Gross as income, the fee as its own expense. */
  if (INCOME_TYPES.has(t.type) && t.amount > 0) {
    const { party, customerId, clientId, category } = await describeCharge(isCharge(source) ? source : null, base.description, names);
    const typed = await findTypedEntry(t.amount, base.date);
    if (typed) {
      // The typed row keeps its words; it gains the transaction id and, if it had no client, the one Stripe knows.
      const r = await updateEntry(typed.id, { stripeRef: t.id, clientId: typed.clientId ?? clientId, memo: [typed.memo, t.id].filter(Boolean).join(" · ") });
      await linkSource(stripeRef(t.id), typed.id);
      const feeEntryId = await postFee(t, base.date, party, who);
      return finish({ ...base, party, customerId, clientId: typed.clientId ?? clientId, state: "matched", entryId: r.ok ? r.entry.id : typed.id, feeEntryId, note: `Matched to the ${typed.source === "ads" ? "ad payment" : "row"} typed in for ${typed.date}.` });
    }
    const r = await post({
      date: base.date,
      cents: t.amount,
      kind: "income",
      category,
      account: "stripe",
      party,
      clientId,
      memo: memoTail,
      who,
      source: "stripe",
      sourceRef: stripeRef(t.id),
      stripeRef: t.id,
      noReceipt: true,
    });
    if (!r.entry) return skip(r.error ?? "The ledger refused it.");
    const feeEntryId = await postFee(t, base.date, party, who);
    return finish({ ...base, party, customerId, clientId, state: "posted", entryId: r.entry.id, feeEntryId });
  }

  /* Money given back. Returns and allowances, not negative income. */
  if (REFUND_TYPES.has(t.type) && t.amount < 0) {
    let charge: Charge | null = null;
    const chargeId = isRefund(source) ? (typeof source.charge === "string" ? source.charge : source.charge?.id) : undefined;
    if (chargeId) {
      const res = await stripeGet<Charge>(`/charges/${chargeId}`);
      if (res.ok) charge = res.data;
    }
    const { party, customerId, clientId } = await describeCharge(charge, base.description, names);
    const r = await post({
      date: base.date,
      cents: -t.amount,
      kind: "expense",
      category: "refunds",
      account: "stripe",
      party,
      clientId,
      memo: `Refund · ${memoTail}`,
      who,
      source: "stripe",
      sourceRef: stripeRef(t.id),
      stripeRef: t.id,
      noReceipt: true,
    });
    if (!r.entry) return skip(r.error ?? "The ledger refused it.");
    const feeEntryId = await postFee(t, base.date, party, who);
    return finish({ ...base, party, customerId, clientId, state: "posted", entryId: r.entry.id, feeEntryId });
  }

  /* The balance going to the bank. A move, not a spend. */
  if (PAYOUT_TYPES.has(t.type) && t.amount < 0) {
    const date = isPayout(source) && source.arrival_date ? utcDateOf(source.arrival_date) : base.date;
    const party = "Stripe payout";
    const r = await post({
      date,
      cents: -t.amount,
      kind: "transfer",
      category: "transfer",
      account: "stripe",
      toAccount: "checking",
      party,
      memo: memoTail,
      who,
      source: "stripe",
      sourceRef: stripeRef(t.id),
      stripeRef: t.id,
      noReceipt: true,
    });
    if (!r.entry) return skip(r.error ?? "The ledger refused it.");
    const feeEntryId = await postFee(t, date, party, who);
    return finish({ ...base, date, party, state: "posted", entryId: r.entry.id, feeEntryId });
  }

  /* A payout that bounced back into the balance. */
  if (PAYOUT_BACK_TYPES.has(t.type) && t.amount > 0) {
    const party = "Stripe payout returned";
    const r = await post({
      date: base.date,
      cents: t.amount,
      kind: "transfer",
      category: "transfer",
      account: "checking",
      toAccount: "stripe",
      party,
      memo: memoTail,
      who,
      source: "stripe",
      sourceRef: stripeRef(t.id),
      stripeRef: t.id,
      noReceipt: true,
    });
    if (!r.entry) return skip(r.error ?? "The ledger refused it.");
    return finish({ ...base, party, state: "posted", entryId: r.entry.id, unusual: true, note: "A payout came back. Check the bank account details in Stripe." });
  }

  /* Stripe billing itself: Radar, Tax, the odd monthly fee. */
  if (FEE_TYPES.has(t.type) && t.amount !== 0) {
    const party = "Stripe";
    const r = await post({
      date: base.date,
      cents: Math.abs(t.amount),
      kind: t.amount < 0 ? "expense" : "income",
      category: t.amount < 0 ? "processing-fees" : "other-income",
      account: "stripe",
      party,
      memo: memoTail,
      who,
      source: "stripe",
      sourceRef: stripeRef(t.id),
      stripeRef: t.id,
      noReceipt: true,
    });
    if (!r.entry) return skip(r.error ?? "The ledger refused it.");
    return finish({ ...base, party, state: "posted", entryId: r.entry.id });
  }

  /* Anything else: a dispute, an adjustment, a Connect transfer. Posted by sign, and flagged. */
  if (t.amount !== 0) {
    const party = `Stripe ${describeType(t.type)}`;
    const r = await post({
      date: base.date,
      cents: Math.abs(t.amount),
      kind: t.amount < 0 ? "expense" : "income",
      category: t.amount < 0 ? "other-expense" : "other-income",
      account: "stripe",
      party,
      memo: memoTail,
      who,
      source: "stripe",
      sourceRef: stripeRef(t.id),
      stripeRef: t.id,
      noReceipt: true,
    });
    if (!r.entry) return skip(r.error ?? "The ledger refused it.");
    const feeEntryId = await postFee(t, base.date, party, who);
    return finish({ ...base, party, state: "posted", entryId: r.entry.id, feeEntryId, unusual: true, note: `Stripe calls this "${t.type}". It's in the ledger as ${t.amount < 0 ? "other expense" : "other income"}; recategorise it if that's wrong.` });
  }

  /* Only a fee moved. */
  const feeEntryId = await postFee(t, base.date, `Stripe ${describeType(t.type)}`, who);
  if (feeEntryId) await linkSource(stripeRef(t.id), feeEntryId);
  return finish({ ...base, party: "Stripe", state: feeEntryId ? "posted" : "skipped", feeEntryId, entryId: feeEntryId, note: feeEntryId ? undefined : "The ledger refused it." });
}

/* --------------------------------- the run -------------------------------- */

export type SyncResult = { ok: true; run: StripeRun; txns: StripeTxn[] } | { ok: false; error: string };

/**
 * Pull everything since the last run and post what is new. Runs nightly
 * from the cron and on demand from the Sync now button, and either can be
 * run twice in a row without harm.
 */
export async function runStripeSync(who: string): Promise<SyncResult> {
  if (!isStripeConfigured()) return { ok: false, error: "STRIPE_RESTRICTED_KEY is not set." };

  const state = await getStripeState();
  const openedUnix = Math.floor(Date.parse(`${syncFrom()}T00:00:00Z`) / 1000);
  const fromUnix = state.lastCreated ? Math.max(openedUnix, state.lastCreated - OVERLAP_SECONDS) : openedUnix;
  const run: StripeRun = { at: new Date().toISOString(), who, ok: false, from: utcDateOf(fromUnix), seen: 0, posted: 0, matched: 0, known: 0, leftOut: 0, skipped: 0 };

  const fetched = await fetchTransactionsSince(fromUnix);
  if (!fetched.ok) {
    run.error = fetched.error;
    await saveState({ ...state, lastRunAt: run.at, lastOk: false, lastError: fetched.error, runs: [run, ...state.runs].slice(0, RUNS_KEPT) });
    return { ok: false, error: fetched.error };
  }

  const txns = [...fetched.data].sort((a, b) => a.created - b.created);
  const names = new Map<string, string>();
  const done: StripeTxn[] = [];
  let lastCreated = state.lastCreated ?? 0;
  run.seen = txns.length;

  for (const t of txns) {
    lastCreated = Math.max(lastCreated, t.created);
    const status = await sourceStatus(stripeRef(t.id));
    if (status?.kind === "entry") {
      run.known += 1;
      continue;
    }
    if (status?.kind === "ignored") {
      run.leftOut += 1;
      continue;
    }
    const rec = await postTransaction(t, who, names);
    done.push(rec);
    if (rec.state === "posted") run.posted += 1;
    else if (rec.state === "matched") run.matched += 1;
    else run.skipped += 1;
  }

  run.ok = true;
  await saveState({ lastRunAt: run.at, lastOk: true, lastError: undefined, lastCreated: lastCreated || undefined, runs: [run, ...state.runs].slice(0, RUNS_KEPT) });
  return { ok: true, run, txns: done };
}

/** One transaction that was left out, brought back in. Re-read from Stripe so the row is exact. */
export async function bringBackStripeTxn(id: string, who: string): Promise<{ ok: true; txn: StripeTxn } | { ok: false; error: string }> {
  await unignoreSource(stripeRef(id));
  const res = await stripeGet<BalanceTransaction>(`/balance_transactions/${id}`, { expand: ["source"] });
  if (!res.ok) return res;
  const txn = await postTransaction(res.data, who, new Map());
  if (txn.state === "skipped") return { ok: false, error: txn.note ?? "It couldn't be posted." };
  return { ok: true, txn };
}

/** In words, for the banner and the audit log. */
export function describeRun(run: StripeRun): string {
  const parts: string[] = [];
  if (run.posted) parts.push(`${run.posted} posted`);
  if (run.matched) parts.push(`${run.matched} matched to rows already typed in`);
  if (run.known) parts.push(`${run.known} already in`);
  if (run.leftOut) parts.push(`${run.leftOut} left out on purpose`);
  if (run.skipped) parts.push(`${run.skipped} skipped`);
  if (parts.length === 0) return "Nothing new in Stripe.";
  return `${run.seen} transaction${run.seen === 1 ? "" : "s"} since ${run.from}: ${parts.join(", ")}.`;
}
