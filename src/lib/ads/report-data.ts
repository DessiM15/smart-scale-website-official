/**
 * The facts in a monthly report.
 *
 * Everything here is measured or derived arithmetically. Nothing in this file
 * is written by a model — the narrative layer is handed these numbers and is
 * never allowed to invent one. That separation is the whole safety story for
 * client-facing reports: a wrong sentence is embarrassing, a wrong number in
 * writing to a paying advertiser is a different kind of problem.
 */

import { getCombinedStats, localStamp, TZ } from "./scan-store";
import { codesForAdvertiser } from "./link-store";
import { daysBetween, formatDate, today, type AdvertiserView } from "./roster";

/**
 * The rotation: 18 slides of 10 seconds is a 3-minute loop, so a spot plays 20
 * times an hour. Open 6am–2pm Mon–Sat (8 hours) and 7am–2pm Sunday (7 hours),
 * closed Mondays.
 */
const PLAYS_PER_HOUR = 20;
const HOURS = { weekday: 8, sunday: 7 };

/** 0 = Sunday. Mondays are closed. */
function playsOnWeekday(weekday: number): number {
  if (weekday === 1) return 0;
  return PLAYS_PER_HOUR * (weekday === 0 ? HOURS.sunday : HOURS.weekday);
}

/**
 * Plays and open days across a window of dates, inclusive.
 *
 * The window is the point. Counting a whole calendar month told an advertiser
 * who started on the 28th that their ad had played four thousand times that
 * month, and told one who has not started at all the same thing. A play is a
 * claim about something that happened on a screen; it can only be counted for
 * days the ad was actually in the rotation, and only for days that have
 * happened.
 */
function playsBetween(from: string, to: string): { plays: number; openDays: number } {
  if (!from || !to || from > to) return { plays: 0, openDays: 0 };

  let plays = 0;
  let openDays = 0;

  const [fy, fm, fd] = from.split("-").map(Number);
  const total = daysBetween(from, to);

  for (let offset = 0; offset <= total; offset += 1) {
    const day = new Date(Date.UTC(fy, fm - 1, fd + offset));
    const dayPlays = playsOnWeekday(day.getUTCDay());
    if (dayPlays > 0) openDays += 1;
    plays += dayPlays;
  }

  return { plays, openDays };
}

/** The days an ad was actually on screen inside a window, clamped to today. */
function onScreenWindow(
  advertiser: AdvertiserView,
  from: string,
  to: string,
): { from: string; to: string } {
  const start = advertiser.startDate > from ? advertiser.startDate : from;
  let end = advertiser.endDate < to ? advertiser.endDate : to;
  // Nothing has played tomorrow.
  const now = today();
  if (end > now) end = now;
  return { from: start, to: end };
}

/** First and last day of a month, as YYYY-MM-DD. */
function monthBounds(month: MonthKey): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

export type MonthKey = string; // YYYY-MM

export function monthKey(date: string): MonthKey {
  return date.slice(0, 7);
}

/** The month before the one given. */
export function previousMonth(key: MonthKey): MonthKey {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: MonthKey): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** The month that just ended, in restaurant time. */
export function lastCompleteMonth(): MonthKey {
  return previousMonth(monthKey(localStamp().date));
}

/**
 * What a report for this month should say about the rotation — the days the ad
 * was actually on screen, and the plays that follow from them.
 *
 * Pure arithmetic over the advertiser's dates, with no database behind it, so
 * two callers can ask cheaply: generation, to skip a month an ad never ran in,
 * and the tracker, to spot a saved draft whose figures no longer match the
 * roster. `openDays` of zero means there is nothing to report — the ad had not
 * started, had already ended, or the only days it covered were Mondays.
 */
export function runInMonth(
  advertiser: AdvertiserView,
  month: MonthKey,
): { from: string; to: string; plays: number; openDays: number } {
  const bounds = monthBounds(month);
  const onScreen = onScreenWindow(advertiser, bounds.from, bounds.to);
  return { ...onScreen, ...playsBetween(onScreen.from, onScreen.to) };
}

export type ReportFacts = {
  advertiserId: string;
  business: string;
  contactName: string;
  category: string;
  planName: string;
  month: MonthKey;
  monthName: string;

  /** Scans in the reported month. */
  scans: number;
  /** Scans in the month before, for comparison. */
  previousScans: number;
  /** Whole-percent change, or null when there's no prior month to compare. */
  changePercent: number | null;
  scansAllTime: number;
  uniquePhones: number;

  /** Busiest single day in the month, if there were any scans. */
  bestDay: { date: string; label: string; count: number } | null;
  /** Busiest hour across the ad's whole life, as a readable window. */
  bestHourWindow: string | null;
  daysWithScans: number;

  /** Times the ad played during the month — rotation arithmetic, not measured. */
  plays: number;
  /** Days the restaurant was open in the month. */
  openDays: number;

  /* ------------------------- the whole run so far ------------------------- */

  /** Plays across every day the ad has been on screen this term. */
  termPlays: number;
  termOpenDays: number;
  /** Scans across the same window. */
  termScans: number;
  /** The window those two cover — the term to date, not the term as sold. */
  termFrom: string;
  termTo: string;
  /** The term has run its course, so the figures above are the final ones. */
  termComplete: boolean;

  termEnds: string;
  daysRemaining: number;

  /** Every figure above that a narrative is allowed to mention. */
  allowedNumbers: number[];
};

const HOUR_LABEL = (h: number) => {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
};

export async function buildReportFacts(
  advertiser: AdvertiserView,
  month: MonthKey,
): Promise<ReportFacts> {
  // Every code they own, added together — a client with a flyer code as well as
  // a screen code is owed both in their report.
  const codes = await codesForAdvertiser(advertiser.id, advertiser.qrCode);

  // Long enough to cover the reported month, the one before it, and the whole
  // term to date — the term total is asked for at the end of a run, and
  // fetching it separately would mean two windows that could disagree.
  const termSoFar = onScreenWindow(advertiser, advertiser.startDate, advertiser.endDate);
  const termDays = termSoFar.from <= termSoFar.to
    ? daysBetween(termSoFar.from, termSoFar.to) + 1
    : 0;
  const window = Math.min(400, Math.max(75, termDays + 5));

  const stats = codes.length > 0 ? await getCombinedStats(codes, window) : null;

  const series = stats?.series ?? [];
  const inMonth = series.filter((p) => p.date.startsWith(month));
  const prevKey = previousMonth(month);
  const inPrevMonth = series.filter((p) => p.date.startsWith(prevKey));

  const scans = inMonth.reduce((sum, p) => sum + p.count, 0);
  const previousScans = inPrevMonth.reduce((sum, p) => sum + p.count, 0);

  const busiest = inMonth.reduce<{ date: string; count: number } | null>(
    (best, p) => (p.count > 0 && (!best || p.count > best.count) ? p : best),
    null,
  );

  const byHour = stats?.byHour ?? [];
  const peakHour = byHour.reduce(
    (best, count, hour) => (count > (byHour[best] ?? 0) ? hour : best),
    0,
  );

  // Only the days this ad was actually in the rotation, and only days that have
  // happened. A month is not a run.
  const { plays, openDays } = runInMonth(advertiser, month);

  const term = playsBetween(termSoFar.from, termSoFar.to);
  const termScans = series
    .filter((p) => p.date >= termSoFar.from && p.date <= termSoFar.to)
    .reduce((sum, p) => sum + p.count, 0);

  const changePercent =
    previousScans > 0
      ? Math.round(((scans - previousScans) / previousScans) * 100)
      : null;

  const facts: Omit<ReportFacts, "allowedNumbers"> = {
    advertiserId: advertiser.id,
    business: advertiser.business,
    contactName: advertiser.contactName,
    category: advertiser.category,
    planName: advertiser.planName,
    month,
    monthName: monthLabel(month),
    scans,
    previousScans,
    changePercent,
    scansAllTime: stats?.total ?? 0,
    uniquePhones: stats?.uniqueDevices ?? 0,
    bestDay: busiest
      ? {
          date: busiest.date,
          label: formatDate(busiest.date),
          count: busiest.count,
        }
      : null,
    bestHourWindow:
      byHour.some((c) => c > 0) ? `${HOUR_LABEL(peakHour)}–${HOUR_LABEL(peakHour + 1)}` : null,
    daysWithScans: inMonth.filter((p) => p.count > 0).length,
    plays,
    openDays,
    termPlays: term.plays,
    termOpenDays: term.openDays,
    termScans,
    termFrom: termSoFar.from,
    termTo: termSoFar.to,
    termComplete: advertiser.daysRemaining <= 0,
    termEnds: advertiser.endDate,
    daysRemaining: advertiser.daysRemaining,
  };

  return { ...facts, allowedNumbers: collectNumbers(facts) };
}

/** Every distinct number appearing in a piece of text. */
export function numbersIn(text: string): number[] {
  const found = text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return [...new Set(found.map((n) => Number(n.replace(/,/g, ""))))].filter((n) =>
    Number.isFinite(n),
  );
}

/**
 * The only numbers a narrative may contain: anything the model was shown.
 *
 * That has to include numbers inside the *words* it was given, not just the
 * measured figures — "July 2026" contains 2026, "10am–11am" contains 10 and 11,
 * and a business can be called 911 Repo. Checking only the numeric fields
 * rejects correct writing, which is worse than useless: it would push every
 * report to the plain fallback and quietly switch the feature off.
 */
function collectNumbers(facts: Omit<ReportFacts, "allowedNumbers">): number[] {
  const values = [
    facts.scans,
    facts.previousScans,
    facts.scansAllTime,
    facts.uniquePhones,
    facts.bestDay?.count,
    facts.daysWithScans,
    facts.plays,
    facts.openDays,
    facts.termPlays,
    facts.termOpenDays,
    facts.termScans,
    facts.daysRemaining,
    facts.changePercent === null ? undefined : Math.abs(facts.changePercent),
  ].filter((n): n is number => typeof n === "number");

  // Numbers carried inside the text the model sees.
  const words = [
    facts.business,
    facts.category,
    facts.planName,
    facts.monthName,
    facts.bestHourWindow ?? "",
    facts.bestDay?.label ?? "",
    formatDate(facts.termFrom),
    formatDate(facts.termTo),
  ].join(" ");

  return [...new Set([...values, ...numbersIn(words)])];
}

export { TZ };
