/**
 * The facts in a monthly report.
 *
 * Everything here is measured or derived arithmetically. Nothing in this file
 * is written by a model — the narrative layer is handed these numbers and is
 * never allowed to invent one. That separation is the whole safety story for
 * client-facing reports: a wrong sentence is embarrassing, a wrong number in
 * writing to a paying advertiser is a different kind of problem.
 */

import { getCodeStats, localStamp, TZ } from "./scan-store";
import { formatDate, type AdvertiserView } from "./roster";

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
  // 70 days covers the reported month and the one before it in every case.
  const stats = advertiser.qrCode
    ? await getCodeStats(advertiser.qrCode, 70)
    : null;

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

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  let plays = 0;
  let openDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(Date.UTC(year, mon - 1, day)).getUTCDay();
    const dayPlays = playsOnWeekday(weekday);
    if (dayPlays > 0) openDays += 1;
    plays += dayPlays;
  }

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
  ].join(" ");

  return [...new Set([...values, ...numbersIn(words)])];
}

export { TZ };
