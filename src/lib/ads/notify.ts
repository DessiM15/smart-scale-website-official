/**
 * Outbound alerts for the ad business, plus the ledger that keeps them from
 * repeating.
 *
 * Two rules shape this file:
 *   1. A notice fires once. The cron runs every day, so without a durable
 *      record of what has already gone out, a 7-day warning becomes a daily
 *      one and everybody stops reading them.
 *   2. Nothing here throws. A Twilio outage or a missing env var degrades to a
 *      recorded failure, never a 500 on the cron endpoint.
 */

import twilio from "twilio";
import { redisPipeline, redisWrite } from "./redis";

const LEDGER_TTL_SECONDS = 400 * 24 * 60 * 60;
const RUN_LOG_LIMIT = 30;

/** Who gets the internal alerts. Comma-separated, E.164 or 10-digit US. */
export function alertRecipients(): string[] {
  return (process.env.ADS_ALERT_PHONES ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .map(toE164);
}

function toE164(raw: string): string {
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

export function isAlertingConfigured(): boolean {
  return isSmsConfigured() && alertRecipients().length > 0;
}

export type SendResult = { to: string; ok: boolean; error?: string };

/** Sends one message to every internal recipient. Never throws. */
export async function sendTeamSms(body: string): Promise<SendResult[]> {
  const recipients = alertRecipients();
  if (!isSmsConfigured() || recipients.length === 0) {
    return recipients.map((to) => ({ to, ok: false, error: "not configured" }));
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );

  return Promise.all(
    recipients.map(async (to) => {
      try {
        await client.messages.create({
          body,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to,
        });
        return { to, ok: true };
      } catch (err) {
        return {
          to,
          ok: false,
          error: err instanceof Error ? err.message : "send failed",
        };
      }
    }),
  );
}

/* --------------------------------- ledger --------------------------------- */

/**
 * One key per (advertiser, term end, milestone). The end date is part of the
 * key on purpose: renew someone and their new term gets a fresh set of
 * notices, while re-running the cron against the same term stays silent.
 */
function ledgerKey(advertiserId: string, endDate: string, milestone: number) {
  return `ads:alert:${advertiserId}:${endDate}:${milestone}`;
}

export async function alreadySent(
  advertiserId: string,
  endDate: string,
  milestone: number,
): Promise<boolean> {
  const [hit] = await redisPipeline([
    ["GET", ledgerKey(advertiserId, endDate, milestone)],
  ]);
  return Boolean(hit);
}

export async function markSent(
  advertiserId: string,
  endDate: string,
  milestone: number,
): Promise<void> {
  const key = ledgerKey(advertiserId, endDate, milestone);
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
