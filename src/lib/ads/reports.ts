/**
 * Monthly advertiser reports.
 *
 * Generated as drafts and held for a person to read before anything is sent.
 * The point of a report is that the advertiser trusts it, and the fastest way
 * to lose that is to have a machine mail something odd on the first of the
 * month while nobody is looking. Approval can be relaxed later; it costs a
 * minute a month now.
 */

import { redisPipeline, redisWrite } from "./redis";
import { sendEmail } from "./email";
import { reportEmail } from "./email";
import {
  buildReportFacts,
  lastCompleteMonth,
  monthLabel,
  runInMonth,
  type MonthKey,
  type ReportFacts,
} from "./report-data";
import {
  templateNarrative,
  unsupportedNumbers,
  writeNarrative,
  type Narrative,
} from "./narrative";
import { codesForAdvertiser } from "./link-store";
import { getAdvertiser, listAdvertisers, toView, type AdvertiserView } from "./roster";
import { localStamp } from "./scan-store";
import { sendTeamSms } from "./notify";

export type ReportStatus = "draft" | "sent" | "skipped";

export type MonthlyReport = {
  advertiserId: string;
  business: string;
  email: string;
  month: MonthKey;
  facts: ReportFacts;
  narrative: Narrative;
  status: ReportStatus;
  createdAt: string;
  sentAt?: string;
};

const KEY = (id: string, month: MonthKey) => `ads:report:${id}:${month}`;
const INDEX = "ads:reports";
const TTL_SECONDS = 400 * 24 * 60 * 60;

export async function getReport(
  advertiserId: string,
  month: MonthKey,
): Promise<MonthlyReport | null> {
  const [raw] = await redisPipeline([["GET", KEY(advertiserId, month)]]);
  try {
    return raw ? (JSON.parse(String(raw)) as MonthlyReport) : null;
  } catch {
    return null;
  }
}

async function put(report: MonthlyReport): Promise<boolean> {
  const key = KEY(report.advertiserId, report.month);
  return redisWrite([
    ["SET", key, JSON.stringify(report)],
    ["EXPIRE", key, TTL_SECONDS],
    ["SADD", INDEX, key],
  ]);
}

export async function listReports(): Promise<MonthlyReport[]> {
  const [keys] = await redisPipeline([["SMEMBERS", INDEX]]);
  const list = Array.isArray(keys) ? keys.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list]]);
  if (!Array.isArray(values)) return [];
  return values
    .map((raw) => {
      try {
        return raw ? (JSON.parse(String(raw)) as MonthlyReport) : null;
      } catch {
        return null;
      }
    })
    .filter((r): r is MonthlyReport => r !== null)
    .sort(
      (a, b) => b.month.localeCompare(a.month) || a.business.localeCompare(b.business),
    );
}

export type GenerationResult = {
  month: MonthKey;
  created: number;
  skipped: number;
  notes: string[];
};

/**
 * Builds a draft per eligible advertiser. Safe to run repeatedly — an existing
 * report for the month is left alone, so a re-run never overwrites an edit or
 * re-sends something.
 */
export async function generateReports(
  month: MonthKey = lastCompleteMonth(),
): Promise<GenerationResult> {
  const advertisers = (await listAdvertisers()).filter((a) => a.status === "active");
  const notes: string[] = [];
  let created = 0;
  let skipped = 0;

  for (const advertiser of advertisers) {
    if (!advertiser.email) {
      skipped += 1;
      notes.push(`${advertiser.business}: no email address on file.`);
      continue;
    }
    // Every code they own, not just the legacy field — a client whose codes
    // were only ever attached by ownership still has scans to report.
    const codes = await codesForAdvertiser(advertiser.id, advertiser.qrCode);
    if (codes.length === 0) {
      skipped += 1;
      notes.push(`${advertiser.business}: no QR code, so there's nothing to report.`);
      continue;
    }
    // A report for a month the ad never ran in is worse than no report: it
    // reads as a month of nothing rather than a month that never happened.
    if (runInMonth(advertiser, month).openDays === 0) {
      skipped += 1;
      notes.push(`${advertiser.business}: wasn't on screen in ${monthLabel(month)}.`);
      continue;
    }
    if (await getReport(advertiser.id, month)) {
      skipped += 1;
      continue;
    }

    const facts = await buildReportFacts(advertiser, month);
    const narrative = await writeNarrative(facts);

    const ok = await put({
      advertiserId: advertiser.id,
      business: advertiser.business,
      email: advertiser.email,
      month,
      facts,
      narrative,
      status: "draft",
      createdAt: new Date().toISOString(),
    });

    if (ok) {
      created += 1;
      if (narrative.rejectedReason) {
        notes.push(
          `${advertiser.business}: fell back to a plain summary (${narrative.rejectedReason}).`,
        );
      }
    } else {
      notes.push(`${advertiser.business}: could not save the draft.`);
    }
  }

  if (created === 0 && notes.length === 0) notes.push("Nothing new to draft.");
  return { month, created, skipped, notes };
}

export async function updateNarrative(
  advertiserId: string,
  month: MonthKey,
  headline: string,
  body: string,
): Promise<boolean> {
  const report = await getReport(advertiserId, month);
  if (!report || report.status === "sent") return false;
  return put({
    ...report,
    narrative: { ...report.narrative, headline, body, source: "template" },
  });
}

/**
 * Whether a saved draft's figures still agree with the roster.
 *
 * Deliberately answered from the dates alone, with no database call, so the
 * tracker can flag every draft on the page for free. It catches the failure
 * that matters: a draft is written once and then kept forever, so a figure
 * computed by an older rule — or before a start date was corrected — stays on
 * screen looking authoritative long after it stopped being true.
 */
export function isReportStale(
  report: MonthlyReport,
  advertiser: AdvertiserView | undefined,
): boolean {
  if (!advertiser) return false;
  const expected = runInMonth(advertiser, report.month);
  return (
    report.facts.plays !== expected.plays ||
    report.facts.openDays !== expected.openDays
  );
}

export type RecalculateResult = {
  ok: boolean;
  error?: string;
  /** The figures moved. False means the draft already matched. */
  changed?: boolean;
  /** The wording was replaced because it cited figures that no longer hold. */
  rewritten?: boolean;
};

/**
 * Rebuilds a draft's figures from the roster and the scan data as they stand
 * now, keeping the report otherwise intact.
 *
 * The wording is the delicate part. It was written — and possibly approved by a
 * person — against the old numbers, so a sentence like "it played four thousand
 * times" survives a recalculation as a lie in prose while every figure beside
 * it is corrected. So the existing wording is re-checked against the new facts
 * with the same guard used on a model draft, and thrown away for a plain
 * summary the moment it cites something that no longer exists.
 *
 * A sent report is never touched. Its figures are the record of what the
 * advertiser was actually told, right or wrong.
 */
export async function recalculateReport(
  advertiserId: string,
  month: MonthKey,
): Promise<RecalculateResult> {
  const report = await getReport(advertiserId, month);
  if (!report) return { ok: false, error: "No such report." };
  if (report.status === "sent") {
    return {
      ok: false,
      error:
        "That report has already been sent. Its figures are the record of what the advertiser was told, so they stay as they are.",
    };
  }

  const advertiser = await getAdvertiser(advertiserId);
  if (!advertiser) {
    return { ok: false, error: "That advertiser is no longer on the roster." };
  }

  const facts = await buildReportFacts(toView(advertiser), month);
  const changed = JSON.stringify(facts) !== JSON.stringify(report.facts);

  const stale = unsupportedNumbers(
    `${report.narrative.headline} ${report.narrative.body}`,
    facts.allowedNumbers,
  );
  const rewritten = stale.length > 0;
  const narrative: Narrative = rewritten
    ? {
        ...templateNarrative(facts),
        rejectedReason: `wording cited ${stale.join(", ")}, which the figures no longer support`,
      }
    : report.narrative;

  if (!changed && !rewritten) return { ok: true, changed: false };

  const ok = await put({ ...report, facts, narrative });
  if (!ok) return { ok: false, error: "Could not save the corrected report." };
  return { ok: true, changed, rewritten };
}

/**
 * Removes a draft outright — for a report that should never have been written,
 * where correcting the figures would only leave a truthful record of nothing.
 * Sent reports are kept, always.
 */
export async function deleteReport(
  advertiserId: string,
  month: MonthKey,
): Promise<{ ok: boolean; error?: string }> {
  const report = await getReport(advertiserId, month);
  if (!report) return { ok: false, error: "No such report." };
  if (report.status === "sent") {
    return { ok: false, error: "A sent report is a record — it can't be deleted." };
  }
  const key = KEY(advertiserId, month);
  const ok = await redisWrite([
    ["DEL", key],
    ["SREM", INDEX, key],
  ]);
  return ok ? { ok: true } : { ok: false, error: "Could not remove that report." };
}

export async function skipReport(
  advertiserId: string,
  month: MonthKey,
): Promise<boolean> {
  const report = await getReport(advertiserId, month);
  if (!report) return false;
  return put({ ...report, status: "skipped" });
}

export async function sendReport(
  advertiserId: string,
  month: MonthKey,
): Promise<{ ok: boolean; error?: string }> {
  const report = await getReport(advertiserId, month);
  if (!report) return { ok: false, error: "No such report." };
  if (report.status === "sent") return { ok: false, error: "Already sent." };

  const { subject, html, text } = reportEmail(report.facts, report.narrative);
  const result = await sendEmail({ to: report.email, subject, html, text });
  if (!result.ok) return result;

  await put({ ...report, status: "sent", sentAt: new Date().toISOString() });
  return { ok: true };
}

/**
 * Called by the daily job. Drafts the previous month's reports on the first of
 * the month and tells the team they're waiting — it never sends anything.
 */
export async function runMonthlyReports(
  force = false,
): Promise<GenerationResult | null> {
  const isFirstOfMonth = localStamp().date.endsWith("-01");
  if (!isFirstOfMonth && !force) return null;

  const result = await generateReports();

  if (result.created > 0) {
    await sendTeamSms(
      `Mex Taco ads · ${result.created} monthly report${result.created === 1 ? "" : "s"} drafted and waiting for your review: smartscaleagent.com/advertise/admin`,
    );
  }

  return result;
}
