/**
 * Money, in whole cents.
 *
 * Every amount in the books is an integer number of cents. Dollars are what
 * people type and read; cents are what gets stored and added up, because a
 * ledger that sums floating-point dollars drifts by a cent eventually and a
 * ledger that is off by a cent is a ledger nobody trusts.
 */

/** "1,234.56", "$1234.5", "1234" → 123456. Null for anything that isn't money. */
export function parseDollars(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!cleaned || !/^-?\d*(\.\d{0,2})?$/.test(cleaned) || cleaned === "-" || cleaned === ".") return null;
  const negative = cleaned.startsWith("-");
  const [whole, fraction = ""] = cleaned.replace("-", "").split(".");
  const cents = Number(whole || "0") * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isFinite(cents)) return null;
  return negative ? -cents : cents;
}

/** 123456 → "$1,234.56". Whole dollars drop the cents when asked to. */
export function formatCents(cents: number, options: { whole?: boolean } = {}): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  if (options.whole && abs % 100 === 0) {
    return `${sign}$${(abs / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `${sign}$${(abs / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 123456 → "1234.56", for a form field. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export const isMonth = (s: string) => /^\d{4}-\d{2}$/.test(s);

/** "2026-09" → "September 2026". */
export function monthName(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

/** "2026-09" → "2026-08" / "2026-10". */
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Days in a month, so a bill "on the 31st" lands on the 30th in September. */
export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
