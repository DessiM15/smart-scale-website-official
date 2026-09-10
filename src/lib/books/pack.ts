/**
 * The accountant pack: a year, or one folder of it, as files.
 *
 * What the CPA gets in April, laid out so nobody has to explain it: a folder
 * per category holding each receipt named by date, who and how much; the
 * ledger for the year as a spreadsheet; a profit and loss by category with
 * the line of the return each one lands on; and a list of every row that has
 * no receipt, with the reason where there is one. Photos are unsealed here,
 * on the server, one at a time as the zip is written.
 */

import { TEAM } from "@/lib/ads/who";
import { fileName, fileReceipts, folderName, yearOf, type FiledReceipt } from "./archive";
import { CATEGORIES, categoryOf } from "./categories";
import { listClients } from "./clients";
import { accountLabel, capitalByPartner, listAllEntries, totals, type Entry } from "./ledger";
import { isReceiptStoreConfigured, listAllReceipts, readReceiptFile } from "./receipts";
import type { ZipEntry } from "./zip";

export type PackScope = { year: string; category?: string };

/* ---------------------------------- csv ----------------------------------- */

function cell(v: string | number | undefined | null): string {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csv(rows: (string | number | undefined | null)[][]): Buffer {
  // A byte-order mark so Excel opens it as UTF-8 without asking.
  return Buffer.from("\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
}

const dollars = (cents: number) => (cents / 100).toFixed(2);

/** Signed for a spreadsheet: money in positive, money out negative, transfers zero on the P&L. */
function signed(e: Entry): string {
  if (e.kind === "transfer") return dollars(e.cents);
  return dollars(e.direction === "in" ? e.cents : -e.cents);
}

const KIND_WORDS: Record<Entry["kind"], string> = {
  income: "Money in",
  expense: "Money out",
  contribution: "Owner put in",
  draw: "Owner took out",
  transfer: "Transfer",
};

function whyNoReceipt(e: Entry): string {
  if (e.noReceipt) return "Marked as having none";
  if (e.source === "stripe") return "Stripe is the record";
  if (e.source === "ads") return "Ad payment; the agreement and Stripe or bank record cover it";
  if (e.kind === "income") return "Income; the bank or Stripe record covers it";
  if (e.kind === "contribution" || e.kind === "draw") return "Owner money; no receipt applies";
  if (e.kind === "transfer") return "Transfer between own accounts";
  return "Missing";
}

/* ---------------------------------- sheets -------------------------------- */

function ledgerSheet(rows: Entry[], filesFor: (e: Entry) => string[], clientName: (id?: string) => string): Buffer {
  const header = ["Date", "Kind", "Category", "Form 1065 line", "Who", "Client", "Amount", "Account", "To account", "Memo", "Came from", "Logged by", "Receipt files"];
  const body = rows.map((e) => {
    const c = categoryOf(e.category);
    return [
      e.date,
      KIND_WORDS[e.kind],
      c.label,
      c.line,
      e.kind === "contribution" || e.kind === "draw" ? e.partner ?? "" : e.party,
      clientName(e.clientId),
      signed(e),
      accountLabel(e.account),
      e.toAccount ? accountLabel(e.toAccount) : "",
      e.memo,
      e.source === "manual" ? "typed in" : e.source,
      e.who,
      filesFor(e).join("; "),
    ];
  });
  return csv([header, ...body]);
}

function profitAndLossSheet(year: string, rows: Entry[]): Buffer {
  const sums = totals(rows);
  const out: (string | number)[][] = [[`Smart Scale LLC · ${year} · profit and loss by category`], []];
  const section = (title: string, kind: "income" | "expense") => {
    out.push([title, "Form 1065 line", "Rows", "Total", kind === "expense" ? "Deductible" : ""]);
    for (const c of CATEGORIES.filter((c) => c.kind === kind)) {
      const inCat = rows.filter((e) => e.category === c.id && e.kind === kind);
      if (inCat.length === 0) continue;
      const total = inCat.reduce((s, e) => s + e.cents, 0);
      out.push([c.label, c.line, inCat.length, dollars(total), kind === "expense" ? dollars(Math.round(total * (c.deductible ?? 1))) : ""]);
    }
    out.push([]);
  };
  section("Income", "income");
  section("Expenses", "expense");
  const deductible = rows.filter((e) => e.kind === "expense").reduce((s, e) => s + Math.round(e.cents * (categoryOf(e.category).deductible ?? 1)), 0);
  out.push(["Gross income", "", "", dollars(sums.income)]);
  out.push(["Total expenses", "", "", dollars(sums.expense)]);
  out.push(["Net", "", "", dollars(sums.net)]);
  out.push(["Expenses after the 50% meals rule", "", "", dollars(deductible)]);
  out.push([]);
  out.push(["Owner money (not on the P&L)", "Put in", "Taken out", "Net"]);
  for (const p of capitalByPartner(rows, TEAM)) out.push([p.partner, dollars(p.contributed), dollars(p.drawn), dollars(p.net)]);
  out.push([]);
  const contractors = rows.filter((e) => e.kind === "expense" && categoryOf(e.category).contractor);
  if (contractors.length) {
    out.push(["Paid to contractors (1099 check)", "Rows", "Total"]);
    const byParty = new Map<string, { n: number; cents: number }>();
    for (const e of contractors) {
      const cur = byParty.get(e.party) ?? { n: 0, cents: 0 };
      byParty.set(e.party, { n: cur.n + 1, cents: cur.cents + e.cents });
    }
    for (const [party, v] of byParty) out.push([party, v.n, dollars(v.cents)]);
  }
  return csv(out);
}

function noReceiptSheet(rows: Entry[]): Buffer {
  const header = ["Date", "Kind", "Category", "Who", "Amount", "Why there is no receipt"];
  return csv([header, ...rows.map((e) => [e.date, KIND_WORDS[e.kind], categoryOf(e.category).label, e.party, signed(e), whyNoReceipt(e)])]);
}

function readme(scope: PackScope, counts: { rows: number; files: number; bare: number; unreadable: string[] }, storeReady: boolean): Buffer {
  const c = scope.category ? categoryOf(scope.category) : null;
  const lines = [
    `Smart Scale LLC · receipts and books · ${scope.year}${c ? ` · ${c.label}` : ""}`,
    `Made ${new Date().toISOString().slice(0, 10)} from the Books ledger.`,
    "",
    "How this is laid out",
    `  ${scope.year}/<category>/  one folder per expense or income category, named as it appears on Form 1065`,
    "  each photo is named  date  who  amount  so a folder sorts itself by date",
    c ? "  rows.csv           every ledger row in this folder, with the receipt file names" : `  ledger ${scope.year}.csv        every ledger row for the year, with its category, the 1065 line, and the receipt file names`,
    ...(c ? [] : [`  profit and loss ${scope.year}.csv   income and expenses by category with totals, the 50% meals figure, owner money, and a 1099 check`]),
    "  rows with no receipt.csv   every row with no photo and the reason, where there is one",
    "",
    "Notes",
    "  Money in, money out and owner money are kept apart by kind, not by anyone remembering to.",
    "  Meals are listed at the full amount; the P&L shows the 50% deductible figure alongside.",
    "  Rows that came from Stripe carry the Stripe transaction id in the memo; Stripe holds the invoice.",
    "  Transfers between the company's own accounts (bank, Stripe, cash) change no total on the return.",
    "",
    `In this pack: ${counts.rows} rows, ${counts.files} photos, ${counts.bare} rows with no photo.`,
    ...(storeReady ? [] : ["", "File storage was not connected when this was made, so no photos are included. The spreadsheets are complete."]),
    ...(counts.unreadable.length ? ["", "These photos could not be read back and are not included:", ...counts.unreadable.map((n) => `  ${n}`)] : []),
    "",
  ];
  return Buffer.from(lines.join("\r\n"), "utf8");
}

/* --------------------------------- the pack ------------------------------- */

/** The rows a pack covers, oldest first. */
export function packRows(entries: Entry[], scope: PackScope): Entry[] {
  return entries.filter((e) => yearOf(e.date) === scope.year && (!scope.category || e.category === scope.category)).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

/**
 * Every file in the pack, one at a time. Spreadsheets first so they are at
 * the top of the listing, then the photos folder by folder, then the notes,
 * which are written last because they count what actually went in.
 */
export async function* packEntries(scope: PackScope): AsyncGenerator<ZipEntry> {
  const [entries, receipts, clients] = await Promise.all([listAllEntries(), listAllReceipts(), listClients()]);
  const rows = packRows(entries, scope);
  const filed = fileReceipts(rows, receipts);
  const byEntry = new Map<string, FiledReceipt[]>();
  for (const f of filed) byEntry.set(f.entry.id, [...(byEntry.get(f.entry.id) ?? []), f]);
  const names = new Map(clients.map((c) => [c.id, c.name]));
  const clientName = (id?: string) => (id ? names.get(id) ?? "" : "");
  const filesFor = (e: Entry) => (byEntry.get(e.id) ?? []).map((_, i, all) => fileName(e, i, all.length));
  const root = scope.category ? `${scope.year}/${folderName(scope.category)}` : scope.year;
  const stamp = new Date();

  yield { name: `${root}/${scope.category ? "rows" : `ledger ${scope.year}`}.csv`, data: ledgerSheet(rows, filesFor, clientName), mtime: stamp };
  if (!scope.category) yield { name: `${root}/profit and loss ${scope.year}.csv`, data: profitAndLossSheet(scope.year, rows), mtime: stamp };

  const bare: Entry[] = [];
  const unreadable: string[] = [];
  let files = 0;
  const storeReady = isReceiptStoreConfigured();
  for (const e of rows) {
    const onRow = byEntry.get(e.id) ?? [];
    if (onRow.length === 0) {
      bare.push(e);
      continue;
    }
    for (let i = 0; i < onRow.length; i++) {
      const name = `${scope.year}/${folderName(e.category)}/${fileName(e, i, onRow.length)}`;
      const read = storeReady ? await readReceiptFile(onRow[i].receipt.id) : null;
      if (!read) {
        unreadable.push(name);
        continue;
      }
      files += 1;
      yield { name, data: read.bytes, mtime: new Date(`${e.date}T12:00:00Z`) };
    }
  }

  yield { name: `${root}/rows with no receipt.csv`, data: noReceiptSheet(bare), mtime: stamp };
  yield { name: `${root}/READ ME.txt`, data: readme(scope, { rows: rows.length, files, bare: bare.length, unreadable }, storeReady), mtime: stamp };
}

/** What the browser saves it as. */
export function packFileName(scope: PackScope): string {
  return `Smart Scale ${scope.year}${scope.category ? ` ${folderName(scope.category)}` : " books and receipts"}.zip`;
}
