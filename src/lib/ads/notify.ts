/**
 * Internal alerts for the ad business, plus the ledger that keeps them from
 * repeating.
 *
 * The team hears about things by email now. Texts went through Twilio until
 * September 2026, when Dessi asked for texting to go: one provider to look
 * after instead of two, and email is where the renewal notices and reports
 * already live. Everything that used to be a text is a short email to the
 * addresses in `ADS_ALERT_EMAILS`, sent through the same Resend transport
 * the advertiser email uses.
 *
 * Two rules shape this file:
 *   1. A notice fires once. The cron runs every day, so without a durable
 *      record of what has already gone out, a 7-day warning becomes a daily
 *      one and everybody stops reading them.
 *   2. Nothing here throws. A provider outage or a missing env var degrades
 *      to a recorded failure, never a 500 on the cron endpoint.
 */

import { redisPipeline, redisWrite } from "./redis";
import { isEmailConfigured, sendEmail, teamEmail } from "./email";

const LEDGER_TTL_SECONDS = 400 * 24 * 60 * 60;
const RUN_LOG_LIMIT = 30;

/** Who gets the internal alerts. Comma-separated email addresses. */
export function alertRecipients(): string[] {
  return (process.env.ADS_ALERT_EMAILS ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter((n) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(n));
}

/** Email can send at all: the key is present. Recipients are a separate question. */
export function isAlertTransportConfigured(): boolean {
  return isEmailConfigured();
}

export function isAlertingConfigured(): boolean {
  return isEmailConfigured() && alertRecipients().length > 0;
}

export type SendResult = { to: string; ok: boolean; error?: string };

export type TeamNotice = {
  /** The subject line. Say what happened; the name of the business goes here. */
  subject: string;
  /** Short lines, one fact each. Rendered as a plain list. */
  lines: string[];
  /** Where in the portal to go and deal with it. */
  href?: string;
  /** The button's wording. Defaults to "Open Ad Ops". */
  cta?: string;
};

/** Sends one notice to every internal recipient. Never throws. */
export async function notifyTeam(notice: TeamNotice): Promise<SendResult[]> {
  const recipients = alertRecipients();
  if (!isEmailConfigured() || recipients.length === 0) {
    return recipients.map((to) => ({ to, ok: false, error: "not configured" }));
  }
  const message = teamEmail(notice);
  return Promise.all(
    recipients.map(async (to) => {
      const result = await sendEmail({ to, ...message });
      return { to, ok: result.ok, error: result.error };
    }),
  );
}

/* --------------------------------- ledger --------------------------------- */

/**
 * One key per (advertiser, term end, marker). The end date is part of the key
 * on purpose: renew someone and their new term gets a fresh set of notices,
 * while re-running the cron against the same term stays silent.
 *
 * `marker` is the milestone for a team notice and `e<milestone>` for an
 * advertiser email, so the two retry independently — a failed advertiser
 * email isn't swallowed just because the team's went out.
 */
function ledgerKey(
  advertiserId: string,
  endDate: string,
  marker: number | string,
) {
  return `ads:alert:${advertiserId}:${endDate}:${marker}`;
}

export async function alreadySent(
  advertiserId: string,
  endDate: string,
  marker: number | string,
): Promise<boolean> {
  const [hit] = await redisPipeline([
    ["GET", ledgerKey(advertiserId, endDate, marker)],
  ]);
  return Boolean(hit);
}

export async function markSent(
  advertiserId: string,
  endDate: string,
  marker: number | string,
): Promise<void> {
  const key = ledgerKey(advertiserId, endDate, marker);
  await redisWrite([
    ["SET", key, new Date().toISOString()],
    ["EXPIRE", key, LEDGER_TTL_SECONDS],
  ]);
}

/* -------------------------------- run log --------------------------------- */

export type RunLogEntry = {
  at: string;
  /** "cron" or "manual" — a hand-run check shouldn't look like a scheduled one. */
  trigger: string;
  checked: number;
  sent: number;
  failed: number;
  notes: string[];
};

export async function recordRun(entry: RunLogEntry): Promise<void> {
  await redisWrite([
    ["LPUSH", "ads:alertlog", JSON.stringify(entry)],
    ["LTRIM", "ads:alertlog", 0, RUN_LOG_LIMIT - 1],
  ]);
}

export async function recentRuns(): Promise<RunLogEntry[]> {
  const [raw] = await redisPipeline([["LRANGE", "ads:alertlog", 0, 9]]);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      try {
        return JSON.parse(String(entry)) as RunLogEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is RunLogEntry => e !== null);
}
