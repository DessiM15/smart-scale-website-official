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
import { formatCents } from "./money";
import type { Receipt } from "./receipts";
import type { ExpectedBill } from "./recurring";

const BOOKS = "/advertise/admin/books";

/** Days a manual expense may sit without a receipt before the list mentions it. */
const RECEIPT_GRACE_DAYS = 2;

export type BooksTodayInput = {
  today: string;
  pending: Receipt[];
  bills: ExpectedBill[];
  /** This month's entries, for the ones missing a receipt. */
  entries: Entry[];
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
      title: `${b.bill.vendor} · ${formatCents(b.bill.cents)} expected`,
      detail: `Usually on the ${ordinal(b.bill.day)}${b.daysLate > 0 ? ` · ${b.daysLate} ${b.daysLate === 1 ? "day" : "days"} ago` : " · today"} · Log it once the charge shows`,
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

  return items;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
