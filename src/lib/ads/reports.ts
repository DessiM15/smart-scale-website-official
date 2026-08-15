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
  type MonthKey,
  type ReportFacts,
} from "./report-data";
import { writeNarrative, type Narrative } from "./narrative";
import { listAdvertisers } from "./roster";
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
    if (!advertiser.qrCode) {
      skipped += 1;
      notes.push(`${advertiser.business}: no QR code, so there's nothing to report.`);
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
