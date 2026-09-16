/**
 * Scans that turned into leads.
 *
 * A campaign code that lands on our own site can be followed: the redirect
 * drops a cookie naming the code, and when the person then fills in a form
 * on smartscaleagent.com the submission carries it. Counted here per code
 * and per day, with no personal data: the lead itself goes to the inbox the
 * form already sends to, stamped with where it came from.
 *
 * Only ever additive and never allowed to break a form: a failed count is a
 * count lost, not a submission lost.
 */

import { redisPipeline, redisWrite, isRedisConfigured } from "./redis";
import { localStamp } from "./scan-store";

const KEY = "qr:lead";
const DAY_TTL_SECONDS = 400 * 24 * 60 * 60;
const RECENT_LIMIT = 40;

/** The cookie the redirect sets and the forms read. */
export const SOURCE_COOKIE = "ss_src";
export const SOURCE_COOKIE_DAYS = 30;

/** The code, cleaned, or blank. Same rules as a /go/ code. */
export function cleanSource(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 24);
}

export type ConversionInput = {
  code: string;
  /** "contact" or "advertise": which form they filled in. */
  form: string;
  at?: Date;
};

export async function recordConversion(input: ConversionInput): Promise<void> {
  const code = cleanSource(input.code);
  if (!code || !isRedisConfigured()) return;
  const stamp = localStamp(input.at);
  const dayKey = `${KEY}:day:${code}:${stamp.date}`;
  const event = JSON.stringify({ t: (input.at ?? new Date()).toISOString(), form: input.form.slice(0, 20) });
  await redisWrite([
    ["INCR", `${KEY}:total:${code}`],
    ["INCR", dayKey],
    ["EXPIRE", dayKey, DAY_TTL_SECONDS],
    ["LPUSH", `${KEY}:recent:${code}`, event],
    ["LTRIM", `${KEY}:recent:${code}`, 0, RECENT_LIMIT - 1],
  ]);
}

/** All-time leads per code, in the order asked. Zero for a code never converted. */
export async function leadsForCodes(codes: string[]): Promise<number[]> {
  if (codes.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...codes.map((c) => `${KEY}:total:${c}`)]]);
  return codes.map((_, i) => (Array.isArray(values) ? Number(values[i] ?? 0) || 0 : 0));
}

export type ConversionEvent = { at: string; form: string };

export async function recentConversions(code: string): Promise<ConversionEvent[]> {
  const [raw] = await redisPipeline([["LRANGE", `${KEY}:recent:${cleanSource(code)}`, 0, RECENT_LIMIT - 1]]);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      try {
        const e = JSON.parse(String(r)) as { t: string; form: string };
        return { at: e.t, form: e.form };
      } catch {
        return null;
      }
    })
    .filter((e): e is ConversionEvent => e !== null);
}
