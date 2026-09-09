"use server";

/**
 * Everything the Books pages can do. Same shape as the ads actions: check
 * the session, read the form, write, log who did it, go back with a result.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/ads/auth";
import { isTeamMember } from "@/lib/ads/who";
import { audit } from "@/lib/books/audit";
import { booksAccess, clearBooksSession, deletePasskey, getPasskey, listPasskeys, renamePasskey } from "@/lib/books/passkeys";
import { addVaultDoc, deleteVaultDoc, getVaultDoc, updateVaultDoc } from "@/lib/books/vault";
import { getCompany, issueRevealToken, saveCompany, sealEin, type Company, type Filing } from "@/lib/books/company";
import { recordHistory } from "@/lib/ads/tasks";
import { listAdvertisers, today } from "@/lib/ads/roster";
import { listPayments } from "@/lib/ads/payments";
import { bringBackAdPayment, leaveOutAdPayment, postAdPayment, unpostedAdPayments } from "@/lib/books/ads-bridge";
import { getPayment } from "@/lib/ads/payments";
import { monthName } from "@/lib/books/money";
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
  vault: `${BOOKS}/vault`,
  company: `${BOOKS}/company`,
  passkeys: `${BOOKS}/passkeys`,
} as const;

const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

/**
 * Every Books action needs the shared key and, once anyone has enrolled a
 * passkey, a passkey session. Returns who is acting, from the passkey when
 * there is one.
 */
async function requireBooks(returnTo?: string): Promise<string> {
  if (!(await isSignedIn())) redirect(`${ADMIN}/signin`);
  const access = await booksAccess();
  if (!access.ok) redirect(`${BOOKS}/unlock${returnTo ? `?to=${encodeURIComponent(returnTo)}` : ""}`);
  return access.who;
}

/** The enrolment page and passkey management stay behind the shared key alone. */
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

/** History for the day's strip, and the audit log for good. */
async function log(who: string, action: string, text: string, href?: string, detail?: { target?: string; before?: unknown; after?: unknown }) {
  await Promise.all([
    recordHistory({ who, kind: "books", text, href }),
    audit({ who, action, target: detail?.target, summary: text, before: detail?.before, after: detail?.after }),
  ]);
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
  const toAccount = field(data, "toAccount");

  return {
    input: {
      date,
      cents,
      kind: kind.id as EntryKind,
      category: field(data, "category"),
      account: account as Account,
      toAccount: kind.id === "transfer" && isAccount(toAccount) ? toAccount : undefined,
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
  const who = await requireBooks();
  const to = returnPath(data, PAGES.home);
  const parsed = entryFromForm(data, who);
  if ("error" in parsed) back(to, { err: "entry", detail: parsed.error }, "log");

  const result = await addEntry(parsed.input);
  if (!result.ok) back(to, { err: "entry", detail: result.error }, "log");

  const e = result.entry;
  const what = describe(e.cents, e.partner ?? e.party, e.kind);
  await log(who, "entry.add", `Logged ${what}.`, `${PAGES.ledger}?month=${e.date.slice(0, 7)}#entry-${e.id}`);
  back(to, { msg: "entryAdded", detail: what });
}

export async function updateEntryAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "id");
  const current = id ? await getEntry(id) : null;
  const to = returnPath(data, PAGES.ledger);
  if (!current) back(to, { err: "entrymissing" });

  const parsed = entryFromForm(data, who);
  if ("error" in parsed) back(to, { err: "entry", detail: parsed.error, month: current.date.slice(0, 7) }, `entry-${id}`);

  // Who logged it stays; the edit is in the history under the editor's name.
  const { who: _who, source: _source, ...patch } = parsed.input;
  void _who;
  void _source;
  const result = await updateEntry(id, { ...patch, noReceipt: data.get("noReceipt") === "on" ? true : current.noReceipt });
  if (!result.ok) back(to, { err: "entry", detail: result.error, month: current.date.slice(0, 7) }, `entry-${id}`);

  await log(who, "entry.edit", `Edited ${describe(result.entry.cents, result.entry.partner ?? result.entry.party, result.entry.kind)}.`, `${PAGES.ledger}?month=${result.entry.date.slice(0, 7)}#entry-${id}`, { target: id, before: current, after: result.entry });
  back(to, { msg: "entrySaved", month: result.entry.date.slice(0, 7) }, `entry-${id}`);
}

export async function deleteEntryAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "id");
  const to = returnPath(data, PAGES.ledger);
  const entry = id ? await deleteEntry(id) : null;
  if (!entry) back(to, { err: "entrymissing" });

  // The photo is not thrown away with the row. It goes back to waiting, in
  // case the row was the mistake and not the receipt.
  if (entry.receiptId) await unconfirmReceipt(entry.receiptId);

  await log(who, "entry.delete", `Removed ${describe(entry.cents, entry.partner ?? entry.party, entry.kind)} from the ledger.`, undefined, { target: id, before: entry });
  back(to, { msg: "entryRemoved", month: entry.date.slice(0, 7) });
}

export async function markNoReceiptAction(data: FormData) {
  const id = field(data, "id");
  const to = returnPath(data, ADMIN);
  const who = await requireBooks(to);
  const result = id ? await updateEntry(id, { noReceipt: true }) : null;
  if (!result || !result.ok) back(to, { err: "entrymissing" });
  await log(who, "entry.noReceipt", `No receipt for ${describe(result.entry.cents, result.entry.party, result.entry.kind)}.`, undefined, { target: id });
  back(to, { msg: "noReceipt" });
}

/* -------------------------------- receipts -------------------------------- */

export async function snapReceiptAction(data: FormData) {
  const who = await requireBooks();
  const file = data.get("photo");
  const to = returnPath(data, PAGES.receipts);
  if (!(file instanceof File) || file.size === 0) back(to, { err: "receiptmissing" }, "snap");

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

  await log(who, "receipt.snap", `Snapped a receipt${r.read?.vendor ? ` from ${r.read.vendor}` : ""}.`, `${PAGES.receipts}/${r.id}`, { target: r.id, after: r.read });
  if (r.readError) back(`${PAGES.receipts}/${r.id}`, { msg: "receiptUnread", detail: r.readError.slice(0, 120) });
  back(`${PAGES.receipts}/${r.id}`, { msg: "receiptRead" });
}

export async function confirmReceiptAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "receiptId");
  const receipt = id ? await getReceipt(id) : null;
  const own = `${PAGES.receipts}/${id}`;
  if (!receipt) back(PAGES.receipts, { err: "receiptgone" });
  if (receipt.status === "confirmed" && receipt.entryId) {
    back(PAGES.ledger, { msg: "receiptDuplicate" }, `entry-${receipt.entryId}`);
  }

  const parsed = entryFromForm(data, who);
  if ("error" in parsed) back(own, { err: "entry", detail: parsed.error });

  const result = await addEntry({ ...parsed.input, receiptId: id, noReceipt: undefined });
  if (!result.ok) back(own, { err: "entry", detail: result.error });
  await confirmReceipt(id, result.entry.id);

  const to = returnPath(data, PAGES.home);
  const what = describe(result.entry.cents, result.entry.party, result.entry.kind);
  await log(who, "receipt.confirm", `Confirmed a receipt: ${what}.`, `${PAGES.ledger}?month=${result.entry.date.slice(0, 7)}#entry-${result.entry.id}`, { target: id, before: receipt.read, after: result.entry });
  back(to, { msg: "receiptConfirmed", detail: what });
}

export async function discardReceiptAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "receiptId");
  const receipt = id ? await getReceipt(id) : null;
  if (!receipt) back(PAGES.receipts, { err: "receiptgone" });
  // A receipt already on a ledger row is removed through the row, not here.
  if (receipt.status === "confirmed" && receipt.entryId) back(PAGES.ledger, { err: "receiptgone" }, `entry-${receipt.entryId}`);

  await deleteReceipt(id);
  await log(who, "receipt.discard", "Discarded a receipt photo.", undefined, { target: id, before: receipt });
  back(returnPath(data, PAGES.receipts), { msg: "receiptDiscarded" });
}

/** A photo for an expense that was typed in first. Filed straight against the row. */
export async function attachReceiptAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "id");
  const entry = id ? await getEntry(id) : null;
  const to = returnPath(data, PAGES.ledger);
  if (!entry) back(to, { err: "entrymissing" });
  const month = entry.date.slice(0, 7);

  const file = data.get("photo");
  if (!(file instanceof File) || file.size === 0) back(to, { err: "receiptmissing", month }, `entry-${id}`);

  const stored = await storeReceipt(file, who, { read: false, entryId: id });
  if (!stored.ok) back(to, { err: "receipt", detail: stored.error, month }, `entry-${id}`);
  if (stored.duplicate && stored.receipt.entryId && stored.receipt.entryId !== id) {
    back(to, { msg: "receiptDuplicate", month }, `entry-${stored.receipt.entryId}`);
  }
  if (stored.receipt.status === "pending") await confirmReceipt(stored.receipt.id, id);

  const result = await updateEntry(id, { receiptId: stored.receipt.id, noReceipt: undefined });
  if (!result.ok) back(to, { err: "entry", detail: result.error, month }, `entry-${id}`);
  await log(who, "receipt.attach", `Attached a receipt to ${describe(entry.cents, entry.party, entry.kind)}.`, `${PAGES.ledger}?month=${month}#entry-${id}`, { target: id, after: stored.receipt.id });
  back(to, { msg: "receiptAttached", month }, `entry-${id}`);
}

/* -------------------------------- clients --------------------------------- */

export async function addClientAction(data: FormData) {
  const who = await requireBooks();
  const result = await addClient({ name: field(data, "name"), note: field(data, "note") });
  if (!result.ok) back(PAGES.clients, { err: "client", detail: result.error ?? "" }, "add-client");
  await log(who, "client.add", `Added client ${result.client!.name}.`, PAGES.clients, { target: result.client!.id });
  back(PAGES.clients, { msg: "clientAdded" });
}

export async function deleteClientAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "id");
  const client = id ? await getClient(id) : null;
  if (!client || !(await deleteClient(id))) back(PAGES.clients, { err: "missing" });
  await log(who, "client.delete", `Removed client ${client.name}.`, undefined, { target: id, before: client });
  back(PAGES.clients, { msg: "clientRemoved" });
}

/* --------------------------------- bills ---------------------------------- */

export async function addBillAction(data: FormData) {
  const who = await requireBooks();
  const cents = parseDollars(field(data, "amount"));
  const account = field(data, "account") || "checking";
  const result = await addBill({
    vendor: field(data, "vendor"),
    cents: cents ?? 0,
    category: field(data, "category"),
    account: (isAccount(account) ? account : "checking") as Account,
    day: Number(field(data, "day")),
    note: field(data, "note"),
    who,
  });
  if (!result.ok) back(PAGES.recurring, { err: "bill", detail: result.error ?? "" }, "add-bill");
  await log(who, "bill.add", `Added a monthly bill: ${field(data, "vendor")}.`, PAGES.recurring);
  back(PAGES.recurring, { msg: "billAdded" });
}

export async function toggleBillAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "id");
  const bill = id ? await getBill(id) : null;
  if (!bill) back(PAGES.recurring, { err: "billmissing" });
  if (!(await setBillActive(id, !bill.active))) back(PAGES.recurring, { err: "save" });
  await log(who, bill.active ? "bill.pause" : "bill.resume", `${bill.active ? "Paused" : "Resumed"} the ${bill.vendor} bill.`, undefined, { target: id });
  back(PAGES.recurring, { msg: bill.active ? "billPaused" : "billResumed" });
}

export async function deleteBillAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "id");
  const bill = id ? await getBill(id) : null;
  if (!bill || !(await deleteBill(id))) back(PAGES.recurring, { err: "billmissing" });
  await log(who, "bill.delete", `Removed the ${bill.vendor} bill.`, undefined, { target: id, before: bill });
  back(PAGES.recurring, { msg: "billRemoved" });
}

/** Post this month's charge for a bill: the usual amount unless told otherwise. */
export async function logBillAction(data: FormData) {
  const to = returnPath(data, PAGES.recurring);
  const who = await requireBooks(to);
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
    who,
    source: "recurring",
    sourceRef: billSourceRef(bill.id, month),
    noReceipt: true,
  });
  if (!result.ok) back(to, { err: "entry", detail: result.error });
  const what = `${formatCents(cents)} to ${bill.vendor}`;
  await log(who, "bill.paid", `Paid the ${bill.vendor} bill: ${what}.`, `${PAGES.ledger}?month=${month}#entry-${result.entry.id}`, { target: result.entry.id });
  back(to, { msg: "billLogged", detail: what });
}

/* -------------------------------- ad money -------------------------------- */

/** Every ad payment the ledger has not seen yet, posted now. Safe to run twice. */
export async function importAdPaymentsAction(data: FormData) {
  const to = returnPath(data, PAGES.home);
  const who = await requireBooks(to);
  const advertisers = await listAdvertisers();
  const lists = await Promise.all(advertisers.map((a) => listPayments(a.id)));
  const missing = await unpostedAdPayments(lists.flat());
  const posted: string[] = [];
  for (const p of missing) {
    const entry = await postAdPayment(p, who);
    if (entry) posted.push(`${formatCents(entry.cents)} from ${p.business} (${monthName(entry.date.slice(0, 7))})`);
  }
  if (posted.length > 0) await log(who, "ads.import", `Brought ${posted.length} ad payment${posted.length === 1 ? "" : "s"} into the ledger: ${posted.join("; ")}.`, PAGES.ledger);
  back(to, { msg: "adPaymentsImported", sent: String(posted.length), detail: posted.join("; ") }, "ad-money");
}

/** One ad payment into the ledger. */
export async function postAdPaymentAction(data: FormData) {
  const to = returnPath(data, PAGES.home);
  const who = await requireBooks(to);
  const payment = await getPayment(field(data, "paymentId"));
  if (!payment) back(to, { err: "missing" }, "ad-money");
  const entry = await postAdPayment(payment, who);
  if (!entry) back(to, { err: "entry", detail: "That payment couldn't be posted. It may have been left out on purpose." }, "ad-money");
  const what = `${formatCents(entry.cents)} from ${payment.business}`;
  await log(who, "ads.post", `Brought an ad payment into the ledger: ${what} (${monthName(entry.date.slice(0, 7))}).`, `${PAGES.ledger}?month=${entry.date.slice(0, 7)}#entry-${entry.id}`, { target: entry.id });
  back(to, { msg: "adPaymentPosted", detail: `${what}, ${monthName(entry.date.slice(0, 7))}` }, "ad-money");
}

/** Money that was never the LLC's. Stays out unless brought back. */
export async function leaveOutAdPaymentAction(data: FormData) {
  const to = returnPath(data, PAGES.home);
  const who = await requireBooks(to);
  const payment = await getPayment(field(data, "paymentId"));
  if (!payment) back(to, { err: "missing" }, "ad-money");
  const reason = field(data, "reason") || "not business money";
  if (!(await leaveOutAdPayment(payment.id, reason))) back(to, { err: "save" }, "ad-money");
  await log(who, "ads.leaveOut", `Left an ad payment out of the books: $${payment.amount.toLocaleString("en-US")} from ${payment.business} (${reason}).`, undefined, { target: payment.id });
  back(to, { msg: "adPaymentLeftOut", detail: `${payment.business}` }, "ad-money");
}

export async function bringBackAdPaymentAction(data: FormData) {
  const to = returnPath(data, PAGES.home);
  const who = await requireBooks(to);
  const payment = await getPayment(field(data, "paymentId"));
  if (!payment) back(to, { err: "missing" }, "ad-money");
  await bringBackAdPayment(payment.id);
  const entry = await postAdPayment(payment, who);
  if (!entry) back(to, { err: "save" }, "ad-money");
  await log(who, "ads.post", `Brought an ad payment back into the ledger: ${formatCents(entry.cents)} from ${payment.business}.`, `${PAGES.ledger}?month=${entry.date.slice(0, 7)}#entry-${entry.id}`, { target: entry.id });
  back(to, { msg: "adPaymentPosted", detail: `${formatCents(entry.cents)} from ${payment.business}, ${monthName(entry.date.slice(0, 7))}` }, "ad-money");
}

/* --------------------------------- vault ---------------------------------- */

export async function uploadVaultAction(data: FormData) {
  const who = await requireBooks();
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0) back(PAGES.vault, { err: "vaultmissing" }, "add-doc");
  const result = await addVaultDoc(file, {
    kind: field(data, "kind"),
    label: field(data, "label"),
    issuedOn: field(data, "issuedOn") || undefined,
    renewsOn: field(data, "renewsOn") || undefined,
    note: field(data, "note"),
    who,
  });
  if (!result.ok) back(PAGES.vault, { err: "vault", detail: result.error }, "add-doc");
  await log(who, "vault.add", `Filed ${result.doc.label} in the vault.`, `${PAGES.vault}#doc-${result.doc.id}`, { target: result.doc.id, after: { kind: result.doc.kind, sha256: result.doc.sha256 } });
  back(PAGES.vault, { msg: "vaultSaved", detail: result.doc.label }, `doc-${result.doc.id}`);
}

export async function updateVaultAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "id");
  const before = id ? await getVaultDoc(id) : null;
  if (!before) back(PAGES.vault, { err: "vaultgone" });
  const doc = await updateVaultDoc(id, {
    label: field(data, "label"),
    kind: field(data, "kind"),
    issuedOn: field(data, "issuedOn"),
    renewsOn: field(data, "renewsOn"),
    note: field(data, "note"),
  });
  if (!doc) back(PAGES.vault, { err: "save" }, `doc-${id}`);
  await log(who, "vault.edit", `Updated ${doc.label} in the vault.`, `${PAGES.vault}#doc-${id}`, { target: id, before, after: doc });
  back(PAGES.vault, { msg: "vaultUpdated" }, `doc-${id}`);
}

export async function deleteVaultAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "id");
  const doc = id ? await deleteVaultDoc(id) : null;
  if (!doc) back(PAGES.vault, { err: "vaultgone" });
  await log(who, "vault.delete", `Removed ${doc.label} from the vault.`, undefined, { target: id, before: doc });
  back(PAGES.vault, { msg: "vaultRemoved" });
}

/* -------------------------------- company --------------------------------- */

export async function saveCompanyAction(data: FormData) {
  const who = await requireBooks();
  const before = await getCompany();
  const pct = (name: string) => {
    const n = Number(field(data, name).replace(/[%\s]/g, ""));
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 0;
  };
  const members = before.members.map((m, i) => ({
    name: field(data, `member${i}Name`) || m.name,
    role: field(data, `member${i}Role`) || m.role,
    sharePercent: data.has(`member${i}Share`) ? pct(`member${i}Share`) : m.sharePercent,
  }));
  const formedOn = field(data, "formedOn");
  if (formedOn && !isIsoDate(formedOn)) back(PAGES.company, { err: "company", detail: "That formation date didn't make sense." });
  const next: Company = {
    ...before,
    legalName: field(data, "legalName") || before.legalName,
    dba: field(data, "dba"),
    entityType: field(data, "entityType") || before.entityType,
    taxElection: field(data, "taxElection") || before.taxElection,
    state: field(data, "state") || before.state,
    formedOn,
    registeredAgent: { name: field(data, "agentName"), address: field(data, "agentAddress") },
    principalAddress: field(data, "principalAddress"),
    mailingAddress: field(data, "mailingAddress"),
    members,
    bank: { name: field(data, "bankName") || before.bank.name, last4: field(data, "bankLast4").replace(/\D/g, "").slice(-4) },
    notes: field(data, "notes").slice(0, 2000),
    updatedAt: new Date().toISOString(),
    updatedBy: who,
  };
  if (!(await saveCompany(next))) back(PAGES.company, { err: "save" });
  const { einSealed: _b, ...beforeSafe } = before;
  const { einSealed: _a, ...afterSafe } = next;
  void _b;
  void _a;
  await log(who, "company.save", "Updated the company details.", PAGES.company, { before: beforeSafe, after: afterSafe });
  back(PAGES.company, { msg: "companySaved" });
}

export async function saveEinAction(data: FormData) {
  const who = await requireBooks();
  const sealed = sealEin(field(data, "ein"));
  if ("error" in sealed) back(PAGES.company, { err: "ein", detail: sealed.error }, "ein");
  const company = await getCompany();
  const ok = await saveCompany({ ...company, ...sealed, updatedAt: new Date().toISOString(), updatedBy: who });
  if (!ok) back(PAGES.company, { err: "save" }, "ein");
  await log(who, "company.ein", `Set the EIN (ending ${sealed.einLast4}).`, undefined, { after: { einLast4: sealed.einLast4 } });
  back(PAGES.company, { msg: "einSaved" }, "ein");
}

/** Shows the EIN once. Every reveal is a line in the audit log. */
export async function revealEinAction() {
  const who = await requireBooks();
  const token = await issueRevealToken();
  await audit({ who, action: "company.reveal", summary: "Revealed the EIN." });
  back(PAGES.company, { reveal: token }, "ein");
}

export async function addFilingAction(data: FormData) {
  const who = await requireBooks();
  const label = field(data, "label");
  const month = Number(field(data, "month"));
  const day = Number(field(data, "day"));
  if (!label) back(PAGES.company, { err: "filing", detail: "What is the filing called?" }, "filings");
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
    back(PAGES.company, { err: "filing", detail: "When is it due? A month and a day." }, "filings");
  }
  const company = await getCompany();
  const filing: Filing = { id: `f-${Date.now().toString(36)}`, label: label.slice(0, 120), month, day, note: field(data, "note").slice(0, 200) };
  const ok = await saveCompany({ ...company, filings: [...company.filings, filing], updatedAt: new Date().toISOString(), updatedBy: who });
  if (!ok) back(PAGES.company, { err: "save" }, "filings");
  await log(who, "company.filing.add", `Added a yearly filing: ${filing.label}.`, `${PAGES.company}#filings`, { after: filing });
  back(PAGES.company, { msg: "filingAdded" }, "filings");
}

export async function deleteFilingAction(data: FormData) {
  const who = await requireBooks();
  const id = field(data, "id");
  const company = await getCompany();
  const filing = company.filings.find((f) => f.id === id);
  if (!filing) back(PAGES.company, { err: "missing" }, "filings");
  const ok = await saveCompany({ ...company, filings: company.filings.filter((f) => f.id !== id), updatedAt: new Date().toISOString(), updatedBy: who });
  if (!ok) back(PAGES.company, { err: "save" }, "filings");
  await log(who, "company.filing.delete", `Removed the yearly filing: ${filing.label}.`, undefined, { before: filing });
  back(PAGES.company, { msg: "filingRemoved" }, "filings");
}

/* -------------------------------- passkeys -------------------------------- */

export async function deletePasskeyAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const passkey = id ? await getPasskey(id) : null;
  if (!passkey) back(PAGES.passkeys, { err: "passkeymissing" });
  // Refuse to remove the last one by accident; the shared key alone would
  // then open the books again, which should be a decision, not a slip.
  if ((await listPasskeys()).length === 1 && field(data, "confirm") !== "last") back(PAGES.passkeys, { err: "lastpasskey" });
  await deletePasskey(id);
  const access = await booksAccess();
  await audit({ who: access.who || passkey.who, action: "passkey.remove", target: id, summary: `Removed the passkey ${passkey.label} (${passkey.who}).` });
  back(PAGES.passkeys, { msg: "passkeyRemoved" });
}

export async function renamePasskeyAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const label = field(data, "label").slice(0, 60);
  const passkey = id && label ? await renamePasskey(id, label) : null;
  if (!passkey) back(PAGES.passkeys, { err: "passkeymissing" });
  back(PAGES.passkeys, { msg: "passkeyRenamed" });
}

/** Ends the passkey session on this browser. */
export async function lockBooksAction() {
  const access = await booksAccess();
  await clearBooksSession();
  if (access.ok && access.via === "passkey") await audit({ who: access.who, action: "books.lock", summary: "Locked the books on this browser." });
  back(`${BOOKS}/unlock`, { msg: "booksLocked" });
}
