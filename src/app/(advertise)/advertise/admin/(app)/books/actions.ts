"use server";

/**
 * Everything the Books pages can do. Same shape as the ads actions: check
 * the session, read the form, write, log who did it, go back with a result.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/ads/auth";
import { currentWho, isTeamMember } from "@/lib/ads/who";
import { recordHistory } from "@/lib/ads/tasks";
import { listAdvertisers, today } from "@/lib/ads/roster";
import { listPayments } from "@/lib/ads/payments";
import { postAdPayment, unpostedAdPayments } from "@/lib/books/ads-bridge";
import { addClient, deleteClient, getClient } from "@/lib/books/clients";
import {
  addEntry,
  deleteEntry,
  getEntry,
  isAccount,
  kindOf,
  updateEntry,
  type Account,
  type Direction,
  type EntryInput,
  type EntryKind,
} from "@/lib/books/ledger";
import { formatCents, isIsoDate, isMonth, parseDollars } from "@/lib/books/money";
import { confirmReceipt, deleteReceipt, getReceipt, storeReceipt, unconfirmReceipt } from "@/lib/books/receipts";
import { addBill, billDueDate, billSourceRef, deleteBill, getBill, setBillActive } from "@/lib/books/recurring";

const ADMIN = "/advertise/admin";
const BOOKS = `${ADMIN}/books`;
const PAGES = {
  home: BOOKS,
  ledger: `${BOOKS}/ledger`,
  receipts: `${BOOKS}/receipts`,
  recurring: `${BOOKS}/recurring`,
  clients: `${BOOKS}/clients`,
} as const;

const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

async function requireAdmin() {
  if (!(await isSignedIn())) redirect(`${ADMIN}/signin`);
}

function returnPath(data: FormData, fallback: string): string {
  const wanted = field(data, "returnTo");
  return wanted.startsWith(ADMIN) && !wanted.includes("//") ? wanted.split("?")[0].split("#")[0] : fallback;
}

function back(path: string, params: Record<string, string>, anchor?: string): never {
  const hash = anchor ? `#${anchor}` : "";
  const query = Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  revalidatePath(path);
  redirect(`${path}${query}${hash}`);
}

async function log(text: string, href?: string) {
  await recordHistory({ who: await currentWho(), kind: "books", text, href });
}

/* -------------------------------- entries --------------------------------- */

/**
 * An entry, as the forms send it. Amounts arrive in dollars and leave in
 * cents; a blank date means today; the direction only matters for a transfer.
 */
function entryFromForm(data: FormData, who: string): { input: EntryInput } | { error: string } {
  const kind = kindOf(field(data, "kind"));
  if (!kind) return { error: "Pick what kind of money this is." };
  const cents = parseDollars(field(data, "amount"));
  if (cents === null || cents <= 0) return { error: "How much? Enter an amount greater than zero, like 43.17." };
  const date = field(data, "date") || today();
  if (!isIsoDate(date)) return { error: "When? Give the date the money moved." };
  const account = field(data, "account") || "checking";
  if (!isAccount(account)) return { error: "Which account did it go through?" };
  const partner = field(data, "partner");
  const direction = field(data, "direction");

  return {
    input: {
      date,
      cents,
      kind: kind.id as EntryKind,
      category: field(data, "category"),
      account: account as Account,
      party: field(data, "party"),
      clientId: field(data, "clientId") || undefined,
      partner: isTeamMember(partner) ? partner : undefined,
      memo: field(data, "memo"),
      who,
      source: "manual",
      direction: direction === "in" || direction === "out" ? (direction as Direction) : undefined,
      noReceipt: data.get("noReceipt") === "on" || undefined,
    },
  };
}

const describe = (cents: number, party: string, kind: EntryKind) => {
  const label = kind === "contribution" ? "put in" : kind === "draw" ? "taken out" : kind === "income" ? "from" : kind === "expense" ? "to" : "moved";
  return `${formatCents(cents)} ${label}${party ? ` ${party}` : ""}`;
};

export async function addEntryAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.home);
  const who = await currentWho();
  const parsed = entryFromForm(data, who);
  if ("error" in parsed) back(to, { err: "entry", detail: parsed.error }, "log");

  const result = await addEntry(parsed.input);
  if (!result.ok) back(to, { err: "entry", detail: result.error }, "log");

  const e = result.entry;
  const what = describe(e.cents, e.partner ?? e.party, e.kind);
  await log(`Logged ${what}.`, `${PAGES.ledger}?month=${e.date.slice(0, 7)}#entry-${e.id}`);
  back(to, { msg: "entryAdded", detail: what });
}

export async function updateEntryAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const current = id ? await getEntry(id) : null;
  const to = returnPath(data, PAGES.ledger);
  if (!current) back(to, { err: "entrymissing" });

  const who = await currentWho();
  const parsed = entryFromForm(data, who);
  if ("error" in parsed) back(to, { err: "entry", detail: parsed.error, month: current.date.slice(0, 7) }, `entry-${id}`);

  // Who logged it stays; the edit is in the history under the editor's name.
  const { who: _who, source: _source, ...patch } = parsed.input;
  void _who;
  void _source;
  const result = await updateEntry(id, { ...patch, noReceipt: data.get("noReceipt") === "on" ? true : current.noReceipt });
  if (!result.ok) back(to, { err: "entry", detail: result.error, month: current.date.slice(0, 7) }, `entry-${id}`);

  await log(`Edited ${describe(result.entry.cents, result.entry.partner ?? result.entry.party, result.entry.kind)}.`, `${PAGES.ledger}?month=${result.entry.date.slice(0, 7)}#entry-${id}`);
  back(to, { msg: "entrySaved", month: result.entry.date.slice(0, 7) }, `entry-${id}`);
}

export async function deleteEntryAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const to = returnPath(data, PAGES.ledger);
  const entry = id ? await deleteEntry(id) : null;
  if (!entry) back(to, { err: "entrymissing" });

  // The photo is not thrown away with the row. It goes back to waiting, in
  // case the row was the mistake and not the receipt.
  if (entry.receiptId) await unconfirmReceipt(entry.receiptId);

  await log(`Removed ${describe(entry.cents, entry.partner ?? entry.party, entry.kind)} from the ledger.`);
  back(to, { msg: "entryRemoved", month: entry.date.slice(0, 7) });
}

export async function markNoReceiptAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const to = returnPath(data, ADMIN);
  const result = id ? await updateEntry(id, { noReceipt: true }) : null;
  if (!result || !result.ok) back(to, { err: "entrymissing" });
  await log(`No receipt for ${describe(result.entry.cents, result.entry.party, result.entry.kind)}.`);
  back(to, { msg: "noReceipt" });
}

/* -------------------------------- receipts -------------------------------- */

export async function snapReceiptAction(data: FormData) {
  await requireAdmin();
  const file = data.get("photo");
  const to = returnPath(data, PAGES.receipts);
  if (!(file instanceof File) || file.size === 0) back(to, { err: "receiptmissing" }, "snap");

  const who = await currentWho();
  const stored = await storeReceipt(file, who, { read: true });
  if (!stored.ok) back(to, { err: "receipt", detail: stored.error }, "snap");

  const r = stored.receipt;
  if (stored.duplicate) {
    // Already confirmed once: show the row it made rather than a second form.
    if (r.status === "confirmed" && r.entryId) {
      const entry = await getEntry(r.entryId);
      if (entry) back(PAGES.ledger, { msg: "receiptDuplicate", month: entry.date.slice(0, 7) }, `entry-${entry.id}`);
    }
    back(`${PAGES.receipts}/${r.id}`, { msg: "receiptDuplicate" });
  }

  await log(`Snapped a receipt${r.read?.vendor ? ` from ${r.read.vendor}` : ""}.`, `${PAGES.receipts}/${r.id}`);
  if (r.readError) back(`${PAGES.receipts}/${r.id}`, { msg: "receiptUnread", detail: r.readError.slice(0, 120) });
  back(`${PAGES.receipts}/${r.id}`, { msg: "receiptRead" });
}

export async function confirmReceiptAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "receiptId");
  const receipt = id ? await getReceipt(id) : null;
  const own = `${PAGES.receipts}/${id}`;
  if (!receipt) back(PAGES.receipts, { err: "receiptgone" });
  if (receipt.status === "confirmed" && receipt.entryId) {
    back(PAGES.ledger, { msg: "receiptDuplicate" }, `entry-${receipt.entryId}`);
  }

  const who = await currentWho();
  const parsed = entryFromForm(data, who);
  if ("error" in parsed) back(own, { err: "entry", detail: parsed.error });

  const result = await addEntry({ ...parsed.input, receiptId: id, noReceipt: undefined });
  if (!result.ok) back(own, { err: "entry", detail: result.error });
  await confirmReceipt(id, result.entry.id);

  const to = returnPath(data, PAGES.home);
  const what = describe(result.entry.cents, result.entry.party, result.entry.kind);
  await log(`Confirmed a receipt: ${what}.`, `${PAGES.ledger}?month=${result.entry.date.slice(0, 7)}#entry-${result.entry.id}`);
  back(to, { msg: "receiptConfirmed", detail: what });
}

export async function discardReceiptAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "receiptId");
  const receipt = id ? await getReceipt(id) : null;
  if (!receipt) back(PAGES.receipts, { err: "receiptgone" });
  // A receipt already on a ledger row is removed through the row, not here.
  if (receipt.status === "confirmed" && receipt.entryId) back(PAGES.ledger, { err: "receiptgone" }, `entry-${receipt.entryId}`);

  await deleteReceipt(id);
  await log("Discarded a receipt photo.");
  back(returnPath(data, PAGES.receipts), { msg: "receiptDiscarded" });
}

/** A photo for an expense that was typed in first. Filed straight against the row. */
export async function attachReceiptAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const entry = id ? await getEntry(id) : null;
  const to = returnPath(data, PAGES.ledger);
  if (!entry) back(to, { err: "entrymissing" });
  const month = entry.date.slice(0, 7);

  const file = data.get("photo");
  if (!(file instanceof File) || file.size === 0) back(to, { err: "receiptmissing", month }, `entry-${id}`);

  const who = await currentWho();
  const stored = await storeReceipt(file, who, { read: false, entryId: id });
  if (!stored.ok) back(to, { err: "receipt", detail: stored.error, month }, `entry-${id}`);
  if (stored.duplicate && stored.receipt.entryId && stored.receipt.entryId !== id) {
    back(to, { msg: "receiptDuplicate", month }, `entry-${stored.receipt.entryId}`);
  }
  if (stored.receipt.status === "pending") await confirmReceipt(stored.receipt.id, id);

  const result = await updateEntry(id, { receiptId: stored.receipt.id, noReceipt: undefined });
  if (!result.ok) back(to, { err: "entry", detail: result.error, month }, `entry-${id}`);
  await log(`Attached a receipt to ${describe(entry.cents, entry.party, entry.kind)}.`, `${PAGES.ledger}?month=${month}#entry-${id}`);
  back(to, { msg: "receiptAttached", month }, `entry-${id}`);
}

/* -------------------------------- clients --------------------------------- */

export async function addClientAction(data: FormData) {
  await requireAdmin();
  const result = await addClient({ name: field(data, "name"), note: field(data, "note") });
  if (!result.ok) back(PAGES.clients, { err: "client", detail: result.error ?? "" }, "add-client");
  await log(`Added client ${result.client!.name}.`, PAGES.clients);
  back(PAGES.clients, { msg: "clientAdded" });
}

export async function deleteClientAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const client = id ? await getClient(id) : null;
  if (!client || !(await deleteClient(id))) back(PAGES.clients, { err: "missing" });
  await log(`Removed client ${client.name}.`);
  back(PAGES.clients, { msg: "clientRemoved" });
}

/* --------------------------------- bills ---------------------------------- */

export async function addBillAction(data: FormData) {
  await requireAdmin();
  const cents = parseDollars(field(data, "amount"));
  const account = field(data, "account") || "checking";
  const result = await addBill({
    vendor: field(data, "vendor"),
    cents: cents ?? 0,
    category: field(data, "category"),
    account: (isAccount(account) ? account : "checking") as Account,
    day: Number(field(data, "day")),
    note: field(data, "note"),
    who: await currentWho(),
  });
  if (!result.ok) back(PAGES.recurring, { err: "bill", detail: result.error ?? "" }, "add-bill");
  await log(`Added a monthly bill: ${field(data, "vendor")}.`, PAGES.recurring);
  back(PAGES.recurring, { msg: "billAdded" });
}

export async function toggleBillAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const bill = id ? await getBill(id) : null;
  if (!bill) back(PAGES.recurring, { err: "billmissing" });
  if (!(await setBillActive(id, !bill.active))) back(PAGES.recurring, { err: "save" });
  await log(`${bill.active ? "Paused" : "Resumed"} the ${bill.vendor} bill.`);
  back(PAGES.recurring, { msg: bill.active ? "billPaused" : "billResumed" });
}

export async function deleteBillAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const bill = id ? await getBill(id) : null;
  if (!bill || !(await deleteBill(id))) back(PAGES.recurring, { err: "billmissing" });
  await log(`Removed the ${bill.vendor} bill.`);
  back(PAGES.recurring, { msg: "billRemoved" });
}

/** Post this month's charge for a bill: the usual amount unless told otherwise. */
export async function logBillAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.recurring);
  const id = field(data, "id");
  const bill = id ? await getBill(id) : null;
  if (!bill) back(to, { err: "billmissing" });
  const month = isMonth(field(data, "month")) ? field(data, "month") : today().slice(0, 7);
  const cents = field(data, "amount") ? parseDollars(field(data, "amount")) : bill.cents;
  if (cents === null || cents <= 0) back(to, { err: "amount" });
  const date = isIsoDate(field(data, "date")) ? field(data, "date") : billDueDate(bill, month);

  const result = await addEntry({
    date,
    cents,
    kind: "expense",
    category: bill.category,
    account: bill.account,
    party: bill.vendor,
    memo: bill.note,
    who: await currentWho(),
    source: "recurring",
    sourceRef: billSourceRef(bill.id, month),
    noReceipt: true,
  });
  if (!result.ok) back(to, { err: "entry", detail: result.error });
  const what = `${formatCents(cents)} to ${bill.vendor}`;
  await log(`Logged the ${bill.vendor} bill: ${what}.`, `${PAGES.ledger}?month=${month}#entry-${result.entry.id}`);
  back(to, { msg: "billLogged", detail: what });
}

/* -------------------------------- ad money -------------------------------- */

/** Every ad payment the ledger has not seen yet, posted now. Safe to run twice. */
export async function importAdPaymentsAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.home);
  const who = await currentWho();
  const advertisers = await listAdvertisers();
  const lists = await Promise.all(advertisers.map((a) => listPayments(a.id)));
  const missing = await unpostedAdPayments(lists.flat());
  let posted = 0;
  for (const p of missing) {
    if (await postAdPayment(p, who)) posted += 1;
  }
  if (posted > 0) await log(`Brought ${posted} ad payment${posted === 1 ? "" : "s"} into the ledger.`, PAGES.ledger);
  back(to, { msg: "adPaymentsImported", sent: String(posted) });
}
