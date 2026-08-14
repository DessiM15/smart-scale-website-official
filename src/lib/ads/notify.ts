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
 *
 * Twilio is called over its REST API with `fetch` rather than through the SDK.
 * Sending an SMS is one form-encoded POST, and importing the SDK drags its
 * entire generated type surface — thousands of .d.ts files for every Twilio
 * product — into the type-check graph of every module that touches alerts,
 * which measurably slows `next build`. It also matches how the rest of this
 * folder talks to Upstash and Resend, and it makes the send path testable.
 */

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

/** Overridable so the send path can be pointed at a local stand-in under test. */
function twilioBase(): string {
  return (process.env.TWILIO_API_BASE || "https://api.twilio.com").replace(/\/$/, "");
}

async function sendOne(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;

  try {
    const res = await fetch(
      `${twilioBase()}/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );

    if (res.ok) return { to, ok: true };

    // Twilio returns a JSON body with a human-readable `message` on failure.
    let detail = `HTTP ${res.status}`;
    try {
      const parsed = (await res.json()) as { message?: string; code?: number };
      if (parsed?.message) detail = parsed.message;
    } catch {
      /* keep the status code */
    }
    return { to, ok: false, error: detail };
  } catch (err) {
    return {
      to,
      ok: false,
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}

/** Sends one message to every internal recipient. Never throws. */
export async function sendTeamSms(body: string): Promise<SendResult[]> {
  const recipients = alertRecipients();
  if (!isSmsConfigured() || recipients.length === 0) {
    return recipients.map((to) => ({ to, ok: false, error: "not configured" }));
  }
  return Promise.all(recipients.map((to) => sendOne(to, body)));
}

/* --------------------------------- ledger --------------------------------- */

/**
 * One key per (advertiser, term end, marker). The end date is part of the key
 * on purpose: renew someone and their new term gets a fresh set of notices,
 * while re-running the cron against the same term stays silent.
 *
 * `marker` is the milestone for a team text and `e<milestone>` for an
 * advertiser email, so the two channels retry independently — a failed email
 * isn't swallowed just because the text went out.
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
