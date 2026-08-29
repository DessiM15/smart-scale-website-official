/**
 * The monthly venue statement: everything owed, earned and delivered in a month.
 *
 * This is the one document in the system that goes to somebody who is owed
 * money by it, which sets the standard. Every figure is derived from a recorded
 * fact — a payment that landed, a term that ran, a scan that happened — and
 * nothing is estimated without being labelled as an estimate. Where a number
 * cannot be computed it is absent rather than approximated, because a statement
 * that quietly rounds is one nobody can check.
 */

import { daysBetween, listAdvertisers, today, type AdvertiserView } from "./roster";
import { paymentsInMonth, sumPayments, type Payment } from "./payments";
import { getSettings, venueShareOf, type Settings } from "./settings";
import { listLinks, linksForAdvertiser } from "./link-store";
import { getCombinedStats, localStamp } from "./scan-store";
import { SELLABLE_SLOTS } from "./roster";

/** Plays per open day, from the rotation: 18 slides x 10s = a 3-minute loop. */
const PLAYS_PER_OPEN_DAY_WEEKDAY = 160;
const PLAYS_PER_OPEN_DAY_SUNDAY = 140;

export type StatementLine = {
  advertiserId: string;
  business: string;
  category: string;
  planName: string;
  /** What they paid this month, from recorded payments only. */
  collected: number;
  payments: Payment[];
  /** Scans on every code they own, this month. */
  scans: number;
  previousScans: number;
  /** Whether their term covered any part of this month. */
  ranThisMonth: boolean;
};

export type Statement = {
  month: string;
  monthName: string;
  /** First and last day of the month, YYYY-MM-DD. */
  from: string;
  to: string;

  settings: Settings;

  /** Money that actually arrived this month. */
  collected: number;
  venueShare: number;
  retained: number;

  lines: StatementLine[];
  unattributed: Payment[];

  activeCount: number;
  openSlots: number;
  categories: string[];

  scans: number;
  previousScans: number;
  /** Estimated ad plays across the month, from the rotation and opening hours. */
  plays: number;
  openDays: number;

  /** Terms ending within 45 days of the month's end. */
  upcoming: AdvertiserView[];

  generatedAt: string;
};

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * The month before today, which is the one you would actually be settling.
 *
 * Read off the restaurant's wall clock rather than UTC: on the evening of the
 * 31st, UTC has already rolled into the next month and would offer to settle a
 * month that has not finished.
 */
export function lastCompleteMonth(at = new Date()): string {
  return previousMonth(localStamp(at).date.slice(0, 7));
}

function monthBounds(month: string): { from: string; to: string; days: number } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, "0")}`,
    days: last,
  };
}

/**
 * Mondays are closed; Sunday runs shorter hours than the rest of the week.
 *
 * Stops at today, because a statement opened part-way through a month would
 * otherwise count days that have not happened — and this is a document about
 * what was delivered, handed to the person owed money for it.
 */
function playsForMonth(
  month: string,
  asOf = today(),
): { plays: number; openDays: number } {
  const [y, m] = month.split("-").map(Number);
  const { days } = monthBounds(month);
  let plays = 0;
  let openDays = 0;
  for (let day = 1; day <= days; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    if (date > asOf) break;
    const weekday = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
    if (weekday === 1) continue; // closed Mondays
    openDays += 1;
    plays += weekday === 0 ? PLAYS_PER_OPEN_DAY_SUNDAY : PLAYS_PER_OPEN_DAY_WEEKDAY;
  }
  return { plays, openDays };
}

/** Did any part of this term fall inside the month? */
function ranIn(view: AdvertiserView, from: string, to: string): boolean {
  return view.startDate <= to && view.endDate >= from;
}

export async function buildStatement(month: string): Promise<Statement> {
  const { from, to } = monthBounds(month);
  const prev = previousMonth(month);
  const prevBounds = monthBounds(prev);

  const [advertisers, payments, prevPayments, settings, links] = await Promise.all([
    listAdvertisers(),
    paymentsInMonth(month),
    paymentsInMonth(prev),
    getSettings(),
    listLinks(),
  ]);
  void prevPayments;

  // Scans need a window long enough to cover this month and the one before it,
  // so the comparison figure comes from the same series rather than a second
  // query with different edges.
  //
  // Counted back from today, not from the month: a fixed 75 days reaches last
  // month and nothing older, so re-opening a statement from the spring reported
  // every advertiser as having had no scans at all — a plausible-looking zero,
  // which is the worst kind of wrong number on a document about money. Capped
  // at 400 days because the daily counters expire there and beyond it the
  // honest answer is that we no longer hold the data.
  const daysBack = Math.min(
    400,
    Math.max(75, daysBetween(prevBounds.from, today()) + 5),
  );

  const lines: StatementLine[] = await Promise.all(
    advertisers.map(async (view) => {
      const theirCodes = linksForAdvertiser(links, view.id, view.qrCode).map(
        (l) => l.code,
      );
      const stats =
        theirCodes.length > 0
          ? await getCombinedStats(theirCodes, daysBack)
          : null;

      const inMonth = (start: string, end: string) =>
        (stats?.series ?? [])
          .filter((p) => p.date >= start && p.date <= end)
          .reduce((sum, p) => sum + p.count, 0);

      const theirPayments = payments.filter((p) => p.advertiserId === view.id);

      return {
        advertiserId: view.id,
        business: view.business,
        category: view.category,
        planName: view.planName,
        collected: sumPayments(theirPayments),
        payments: theirPayments,
        scans: inMonth(from, to),
        previousScans: inMonth(prevBounds.from, prevBounds.to),
        ranThisMonth: ranIn(view, from, to),
      };
    }),
  );

  // A payment against a client who has since been removed still happened and
  // still counts toward the share. Losing it would understate what is owed.
  const known = new Set(advertisers.map((a) => a.id));
  const unattributed = payments.filter((p) => !known.has(p.advertiserId));

  const collected = sumPayments(payments);
  const venueShare = venueShareOf(collected, settings.venueSharePercent);
  const { plays, openDays } = playsForMonth(month);

  const active = advertisers.filter((a) => a.status === "active");

  return {
    month,
    monthName: monthLabel(month),
    from,
    to,
    settings,
    collected,
    venueShare,
    retained: Math.round((collected - venueShare) * 100) / 100,
    lines: lines
      .filter((l) => l.ranThisMonth || l.collected > 0 || l.scans > 0)
      .sort((a, b) => b.collected - a.collected || b.scans - a.scans),
    unattributed,
    activeCount: active.length,
    openSlots: Math.max(0, SELLABLE_SLOTS - active.length),
    categories: [...new Set(active.map((a) => a.category).filter(Boolean))].sort(),
    scans: lines.reduce((sum, l) => sum + l.scans, 0),
    previousScans: lines.reduce((sum, l) => sum + l.previousScans, 0),
    plays,
    openDays,
    upcoming: advertisers
      .filter((a) => a.status === "active" && a.endDate >= to)
      .filter((a) => {
        const [y, m, d] = to.split("-").map(Number);
        const cutoff = new Date(Date.UTC(y, m - 1, d + 45)).toISOString().slice(0, 10);
        return a.endDate <= cutoff;
      })
      .sort((a, b) => a.endDate.localeCompare(b.endDate)),
    generatedAt: new Date().toISOString(),
  };
}
