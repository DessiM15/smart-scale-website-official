/**
 * What the books want from you today.
 *
 * Three things, and only three: a receipt snapped but never confirmed, a
 * regular bill whose day has come and gone without being logged, and an
 * expense typed in with nothing attached. Each is one row on the Today list
 * with the one button that clears it.
 */

import type { TodayAction, TodayItem } from "@/lib/ads/tasks";
import { formatDate } from "@/lib/ads/roster";
import { missingReceipts, type Entry } from "./ledger";
import { formatCents, monthName } from "./money";
import type { Receipt } from "./receipts";
import type { ExpectedBill } from "./recurring";
import type { VaultDoc } from "./vault";
import type { Filing } from "./company";

const BOOKS = "/advertise/admin/books";

/** Days a manual expense may sit without a receipt before the list mentions it. */
const RECEIPT_GRACE_DAYS = 2;

export type BooksTodayInput = {
  today: string;
  pending: Receipt[];
  bills: ExpectedBill[];
  /** This month's entries, for the ones missing a receipt. */
  entries: Entry[];
  /** Vault documents coming up for renewal, or past it. */
  renewals: { doc: VaultDoc; daysLeft: number }[];
  /** Annual filings inside their window. */
  filings: { filing: Filing; dueOn: string; daysLeft: number; key: string }[];
  done: Set<string>;
};

export function buildBooksToday(input: BooksTodayInput): TodayItem[] {
  const items: TodayItem[] = [];

  for (const r of input.pending) {
    const vendor = r.read?.vendor || "an unnamed receipt";
    const amount = r.read?.total != null ? ` · ${formatCents(r.read.total)}` : "";
    items.push({
      key: `receipt:${r.id}`,
      kind: "receipt",
      tone: "warn",
      title: `Confirm the receipt from ${vendor}${amount}`,
      detail: [
        `Snapped ${formatDate(r.capturedAt.slice(0, 10))}${r.who ? ` by ${r.who}` : ""}`,
        r.readError ? "it couldn't be read, so the form is blank" : r.read ? `read with ${r.read.confidence} confidence` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      order: 0,
      actions: [{ type: "link", label: "Confirm", href: `${BOOKS}/receipts/${r.id}` }],
    });
  }

  for (const b of input.bills) {
    if (b.status !== "due") continue;
    items.push({
      key: `bill:${b.bill.id}:${b.month}`,
      kind: "bill",
      tone: b.daysLate > 3 ? "bad" : "warn",
      title: `${b.bill.vendor} · ${formatCents(b.bill.cents)} due${b.daysLate > 0 ? ` ${b.daysLate} ${b.daysLate === 1 ? "day" : "days"} ago` : " today"}`,
      detail: `Comes out on the ${ordinal(b.bill.day)} each month · tap Paid once it has, and it's logged for ${monthName(b.month)}`,
      order: -b.daysLate,
      actions: [
        { type: "logBill", id: b.bill.id, month: b.month } as TodayAction,
        { type: "link", label: "Bills", href: `${BOOKS}/recurring` },
      ],
    });
  }

  for (const e of missingReceipts(input.entries)) {
    const age = Math.round((Date.parse(input.today) - Date.parse(e.date)) / 86_400_000);
    if (age < RECEIPT_GRACE_DAYS) continue;
    items.push({
      key: `noreceipt:${e.id}`,
      kind: "receipt",
      tone: "",
      title: `No receipt for ${e.party || "an expense"} · ${formatCents(e.cents)}`,
      detail: `${formatDate(e.date)}${e.memo ? ` · ${e.memo}` : ""} · Attach the photo, or say there isn't one`,
      order: age,
      actions: [
        { type: "link", label: "Attach", href: `${BOOKS}/ledger?month=${e.date.slice(0, 7)}&open=${e.id}#entry-${e.id}` },
        { type: "noReceipt", id: e.id } as TodayAction,
      ],
    });
  }

  for (const r of input.renewals) {
    const key = `vault:${r.doc.id}:${r.doc.renewsOn}`;
    if (input.done.has(key)) continue;
    items.push({
      key,
      kind: "document",
      tone: r.daysLeft < 0 ? "bad" : r.daysLeft <= 7 ? "warn" : "",
      title: `${r.doc.label} ${r.daysLeft < 0 ? "lapsed" : "renews"} ${r.daysLeft < 0 ? `${-r.daysLeft} days ago` : r.daysLeft === 0 ? "today" : `in ${r.daysLeft} days`}`,
      detail: `${formatDate(r.doc.renewsOn!)} · in the vault · after renewing, put the new date on it`,
      order: r.daysLeft,
      actions: [
        { type: "link", label: "Vault", href: `${BOOKS}/vault#doc-${r.doc.id}` },
        { type: "done", key },
      ],
    });
  }

  for (const f of input.filings) {
    if (input.done.has(f.key)) continue;
    items.push({
      key: f.key,
      kind: "document",
      tone: f.daysLeft < 0 ? "bad" : f.daysLeft <= 14 ? "warn" : "",
      title: `${f.filing.label} ${f.daysLeft < 0 ? "was due" : "due"} ${f.daysLeft < 0 ? `${-f.daysLeft} days ago` : f.daysLeft === 0 ? "today" : `in ${f.daysLeft} days`}`,
      detail: `${formatDate(f.dueOn)}${f.filing.note ? ` · ${f.filing.note}` : ""} · every year`,
      order: f.daysLeft,
      actions: [
        { type: "link", label: "Company", href: `${BOOKS}/company#filings` },
        { type: "done", key: f.key },
      ],
    });
  }

  return items;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
