/**
 * The report the scan worker sends back, and the few words this site puts
 * around it. The worker decides what is wrong; this file only decides how a
 * count or a rating is said. Nothing here ever says a site is compliant.
 */

export type Severity = "critical" | "serious" | "moderate" | "minor";
export type Rating = "good" | "fair" | "needs-work";

export type LeadFinding = {
  id: string;
  severity: Severity;
  title: string;
  plain: string;
  pages: string[];
  count?: string;
  problems: number;
};

export type LeadSection = {
  id: string;
  title: string;
  rating: Rating;
  problems: number;
  serious: number;
  findings: LeadFinding[];
};

export type LeadReport = {
  version: number;
  scanId: string;
  base: string;
  label: string;
  scannedAt: string;
  durationMs: number;
  stack?: string;
  pagesChecked: { path: string; title: string }[];
  totals: { problems: number; serious: number };
  sections: LeadSection[];
  top: string[];
};

/** Enough of a shape check to refuse something that is not a report. */
export function isLeadReport(value: unknown): value is LeadReport {
  const r = value as LeadReport | null;
  return Boolean(
    r &&
      typeof r === "object" &&
      typeof r.base === "string" &&
      r.totals &&
      typeof r.totals.problems === "number" &&
      typeof r.totals.serious === "number" &&
      Array.isArray(r.sections) &&
      Array.isArray(r.top),
  );
}

export const RATING_LABEL: Record<Rating, string> = {
  good: "Good",
  fair: "Fair",
  "needs-work": "Needs work",
};

/** "7 problems found, 3 serious." Never a score. */
export function countLine(totals: { problems: number; serious: number }): string {
  if (totals.problems === 0) return "No problems found by the automated check";
  const problems = `${totals.problems} problem${totals.problems === 1 ? "" : "s"} found`;
  return totals.serious > 0 ? `${problems}, ${totals.serious} serious` : problems;
}

/** The three findings an owner should read first, in the worker's order. */
export function topFindings(report: LeadReport): LeadFinding[] {
  const all = report.sections.flatMap((s) => s.findings);
  const picked = report.top.map((id) => all.find((f) => f.id === id)).filter((f): f is LeadFinding => Boolean(f));
  return (picked.length ? picked : all).slice(0, 3);
}

/** The site's name as a person would say it: no scheme, no trailing slash. */
export function siteName(report: Pick<LeadReport, "base">): string {
  return report.base.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

/** Said under a clean result. Automated checks find about a third of real problems. */
export const CLEAN_NOTE =
  "Automated checks find about a third of the problems a real visitor can run into, so a clean result is a good sign and not a guarantee.";

/** Said wherever a result is shown. */
export const NOT_LEGAL_LINE = "This check is not a legal certification and is not legal advice.";

/** The steps the worker reports, in the words the progress screen uses. */
export const STEP_LABELS: Record<string, string> = {
  load: "Loading your site",
  mobile: "Checking it on a phone",
  keyboard: "Running the keyboard test",
  search: "Checking the Google basics",
  report: "Writing your report",
};
