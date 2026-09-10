/**
 * Receipts, filed the way an accountant wants to find them.
 *
 * Nothing here is stored. The ledger row is the truth: its date says which
 * year, its category says which folder. This reads the rows and the photos
 * filed against them and lays them out as year → category → file, so the
 * archive page and, later, the download are two views of the same shelf.
 * Recategorise a row and its receipt moves folders on its own.
 */

import { CATEGORIES, categoryOf, type Category, type CategoryKind } from "./categories";
import type { Entry } from "./ledger";
import { formatCents } from "./money";
import type { Receipt } from "./receipts";

/** One photo on one row. */
export type FiledReceipt = { receipt: Receipt; entry: Entry };

export type Folder = {
  category: Category;
  /** Rows in this category this year. */
  rows: number;
  cents: number;
  /** Photos filed. */
  files: number;
  /** Rows with no photo and nobody saying there isn't one. */
  missing: number;
  /** Rows marked as having nothing to attach. */
  noReceipt: number;
};

export const yearOf = (date: string) => date.slice(0, 4);
export const isYear = (s: string) => /^\d{4}$/.test(s);

/** Confirmed photos paired with the rows they sit on. Photos whose row is gone are left out. */
export function fileReceipts(entries: Entry[], receipts: Receipt[]): FiledReceipt[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return receipts
    .filter((r) => r.status === "confirmed" && r.entryId && byId.has(r.entryId))
    .map((r) => ({ receipt: r, entry: byId.get(r.entryId!)! }))
    .sort((a, b) => b.entry.date.localeCompare(a.entry.date) || a.receipt.capturedAt.localeCompare(b.receipt.capturedAt));
}

/** Every year with a row in it, newest first. The current year is always there. */
export function yearsOf(entries: Entry[], thisYear: string): string[] {
  return Array.from(new Set([thisYear, ...entries.map((e) => yearOf(e.date))])).sort().reverse();
}

const KIND_ORDER: Record<CategoryKind, number> = { expense: 0, income: 1, capital: 2, transfer: 3 };

/** The folders for one year: every category that has a row, in the order the return reads. */
export function foldersFor(year: string, entries: Entry[], filed: FiledReceipt[]): Folder[] {
  const rows = entries.filter((e) => yearOf(e.date) === year);
  const filesByEntry = new Map<string, number>();
  for (const f of filed) filesByEntry.set(f.entry.id, (filesByEntry.get(f.entry.id) ?? 0) + 1);

  const folders = new Map<string, Folder>();
  for (const e of rows) {
    const category = categoryOf(e.category);
    const folder = folders.get(category.id) ?? { category, rows: 0, cents: 0, files: 0, missing: 0, noReceipt: 0 };
    const files = filesByEntry.get(e.id) ?? 0;
    folder.rows += 1;
    folder.cents += e.cents;
    folder.files += files;
    if (files === 0) {
      if (e.noReceipt) folder.noReceipt += 1;
      else folder.missing += 1;
    }
    folders.set(category.id, folder);
  }
  const order = new Map(CATEGORIES.map((c, i) => [c.id, i]));
  return [...folders.values()].sort((a, b) => KIND_ORDER[a.category.kind] - KIND_ORDER[b.category.kind] || (order.get(a.category.id) ?? 99) - (order.get(b.category.id) ?? 99));
}

/** The photos in one folder, newest row first. */
export function filesFor(year: string, category: string, filed: FiledReceipt[]): FiledReceipt[] {
  return filed.filter((f) => yearOf(f.entry.date) === year && f.entry.category === category);
}

/** Rows in a folder with nothing filed against them. */
export function bareRowsFor(year: string, category: string, entries: Entry[], filed: FiledReceipt[]): Entry[] {
  const withFile = new Set(filed.map((f) => f.entry.id));
  return entries.filter((e) => yearOf(e.date) === year && e.category === category && !withFile.has(e.id)).sort((a, b) => b.date.localeCompare(a.date));
}

/** Totals for the year's header. */
export function yearSummary(folders: Folder[]) {
  return folders.reduce(
    (s, f) => ({ rows: s.rows + f.rows, files: s.files + f.files, missing: s.missing + f.missing, folders: s.folders + 1 }),
    { rows: 0, files: 0, missing: 0, folders: 0 },
  );
}

/** Safe for a file system: letters, digits, spaces, a few marks. */
function safe(s: string): string {
  return s
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/**
 * What a photo is called when it leaves as a file. Date first so a folder
 * sorts itself, then who, then how much. A row with two photos numbers them.
 * "2026-09-04 Vercel $20.00.jpg"
 */
export function fileName(entry: Entry, index = 0, count = 1): string {
  const who = safe(entry.party || categoryOf(entry.category).label) || "receipt";
  const amount = formatCents(entry.cents).replace(/,/g, "");
  const n = count > 1 ? ` (${index + 1} of ${count})` : "";
  return `${entry.date} ${who} ${amount}${n}.jpg`;
}

/** The folder a row's photos live in, as a path inside the year. */
export function folderName(category: string): string {
  return safe(categoryOf(category).label);
}
