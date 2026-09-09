/**
 * The little numbers beside the sidebar items, and which item a path lights.
 *
 * Counts are open work, not totals: a badge that grows forever means nothing.
 */

import { cache } from "react";
import {
  cachedAdvertisers,
  cachedBills,
  cachedEntries,
  cachedPaymentsByAdvertiser,
  cachedPendingReceipts,
  cachedProspects,
  cachedReports,
  cachedResponses,
  cachedTasks,
} from "@/lib/ads/cached";
import { expectedBills } from "@/lib/books/recurring";
import { buildBooksToday } from "@/lib/books/today";
import { overdueAcross } from "@/lib/ads/expected";
import { artworkStatusOf, followUpsDue, isOpenProspect, summarize, today } from "@/lib/ads/roster";
import { setupItems } from "@/lib/ads/setup";
import { buildToday, candidateKeys, doneSet } from "@/lib/ads/tasks";
import type { NavCount, NavKey } from "../_components/shell";

/** Everything the Today page needs, assembled once and shared with the frame. */
export const todayData = cache(async function todayData() {
  const asOf = today();
  const month = asOf.slice(0, 7);
  const [advertisers, prospects, replies, reports, tasks, entries, pendingReceipts, bills] = await Promise.all([
    cachedAdvertisers(),
    cachedProspects(),
    cachedResponses(),
    cachedReports(),
    cachedTasks(),
    cachedEntries(month),
    cachedPendingReceipts(),
    cachedBills(),
  ]);
  const payments = await cachedPaymentsByAdvertiser(advertisers.map((a) => a.id));
  const summary = summarize(advertisers);
  const newLeads = prospects.filter((p) => p.status === "new" && p.source === "Advertise page");
  const followUps = followUpsDue(prospects, asOf);
  const overduePayments = overdueAcross(advertisers, payments, asOf);
  const drafts = reports.filter((r) => r.status === "draft");
  const draftReports = drafts.length ? { count: drafts.length, month: drafts[0].month } : null;

  const books = buildBooksToday({
    today: asOf,
    pending: pendingReceipts,
    bills: expectedBills(bills, entries, month, asOf),
    entries,
  });

  const input = { today: asOf, newLeads, followUps, summary, replies, overduePayments, draftReports, tasks, books };
  const done = await doneSet(candidateKeys(input));
  const items = buildToday({ ...input, done });

  return { asOf, advertisers, prospects, replies, reports, tasks, payments, summary, newLeads, followUps, overduePayments, items, books, pendingReceipts };
});

export async function navCounts(): Promise<Partial<Record<NavKey, NavCount>>> {
  const data = await todayData();
  const openProspects = data.prospects.filter(isOpenProspect);
  const artworkPending = data.advertisers.filter(
    (a) => a.status !== "ended" && artworkStatusOf(a) !== "on-screen",
  ).length;
  const setup = setupItems();
  const setupTodo = setup.filter((i) => i.status !== "on").length;
  const late = data.overduePayments.length;
  const drafts = data.reports.filter((r) => r.status === "draft").length;

  return {
    today: { value: data.items.length, hot: data.items.some((i) => i.tone === "bad") },
    pipeline: { value: openProspects.length, hot: data.newLeads.length > 0 },
    advertisers: { value: data.advertisers.filter((a) => a.status !== "ended").length },
    payments: { value: late, hot: late > 0 },
    artwork: { value: artworkPending },
    reports: { value: drafts, hot: drafts > 0 },
    flyers: { soon: true },
    books: { value: data.books.length, hot: data.books.some((i) => i.tone === "bad") },
    receipts: { value: data.pendingReceipts.length, hot: data.pendingReceipts.length > 0 },
    setup: { value: setupTodo, hot: setup.some((i) => i.essential && i.status !== "on") },
  };
}
