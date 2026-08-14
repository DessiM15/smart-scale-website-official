/**
 * Scan storage for QR redirects, backed by Upstash Redis.
 *
 * Degrades safely — if the database isn't configured the redirect still works,
 * it just doesn't count. A guest scanning an ad must never see an error because
 * our analytics is down. The transport lives in ./redis.
 */

import { createHash } from "crypto";
import { redisPipeline, isRedisConfigured } from "./redis";

/** Restaurant local time. Bucketing days in UTC would split the lunch rush. */
export const TZ = "America/Chicago";

const KEY = "qr";
/** Day/unique keys self-expire after ~13 months. Totals never expire. */
const DAY_TTL_SECONDS = 400 * 24 * 60 * 60;
const RECENT_LIMIT = 60;

export function isScanStoreConfigured(): boolean {
  return isRedisConfigured();
}

const pipeline = redisPipeline;

/* ---------------------------------- dates --------------------------------- */

type LocalStamp = { date: string; hour: number; weekday: number };

/** Calendar date, hour and weekday as they read on the restaurant's wall clock. */
export function localStamp(at: Date = new Date()): LocalStamp {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    weekday: Math.max(0, weekdays.indexOf(get("weekday"))),
  };
}

/** The last `count` calendar dates in restaurant time, oldest first. */
export function recentDates(count: number, at: Date = new Date()): string[] {
  const [y, m, d] = localStamp(at).date.split("-").map(Number);
  const anchor = Date.UTC(y, m - 1, d, 12);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(anchor - i * 86_400_000);
    out.push(day.toISOString().slice(0, 10));
  }
  return out;
}

/* --------------------------------- writing -------------------------------- */

export type DeviceKind = "ios" | "android" | "other";

export function deviceFromUserAgent(ua: string): DeviceKind {
  const s = ua.toLowerCase();
  if (/iphone|ipad|ipod|ios/.test(s)) return "ios";
  if (/android/.test(s)) return "android";
  return "other";
}

/**
 * Rough "different phone?" signal. IP + user agent, hashed with the code and
 * date so nothing personally identifying is ever stored and the same visitor
 * can't be followed from one advertiser to another.
 */
function visitorHash(code: string, date: string, ip: string, ua: string): string {
  return createHash("sha256")
    .update(`${code}|${date}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 24);
}

export type ScanInput = {
  code: string;
  userAgent: string;
  ip: string;
  city?: string;
  region?: string;
  at?: Date;
};

export async function recordScan(input: ScanInput): Promise<void> {
  const { code } = input;
  const stamp = localStamp(input.at);
  const device = deviceFromUserAgent(input.userAgent);
  const visitor = visitorHash(code, stamp.date, input.ip, input.userAgent);
  const dayKey = `${KEY}:day:${code}:${stamp.date}`;
  const uniqDayKey = `${KEY}:uniqday:${code}:${stamp.date}`;

  const event = JSON.stringify({
    t: (input.at ?? new Date()).toISOString(),
    d: device,
    city: input.city || null,
    region: input.region || null,
  });

  await pipeline([
    ["SADD", `${KEY}:codes`, code],
    ["INCR", `${KEY}:total:${code}`],
    ["INCR", dayKey],
    ["EXPIRE", dayKey, DAY_TTL_SECONDS],
    ["HINCRBY", `${KEY}:hour:${code}`, String(stamp.hour), 1],
    ["HINCRBY", `${KEY}:weekday:${code}`, String(stamp.weekday), 1],
    ["HINCRBY", `${KEY}:device:${code}`, device, 1],
    ["PFADD", `${KEY}:uniq:${code}`, visitor],
    ["PFADD", uniqDayKey, visitor],
    ["EXPIRE", uniqDayKey, DAY_TTL_SECONDS],
    ["LPUSH", `${KEY}:recent:${code}`, event],
    ["LTRIM", `${KEY}:recent:${code}`, 0, RECENT_LIMIT - 1],
  ]);
}

/* --------------------------------- reading -------------------------------- */

export type ScanEvent = {
  t: string;
  d: DeviceKind;
  city: string | null;
  region: string | null;
};

export type CodeStats = {
  code: string;
  total: number;
  uniqueDevices: number;
  /** Oldest first, one entry per calendar day. */
  series: { date: string; count: number }[];
  windowTotal: number;
  last7: number;
  today: number;
  byHour: number[];
  byWeekday: number[];
  byDevice: Record<DeviceKind, number>;
  recent: ScanEvent[];
};

const toInt = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

function hashToCounts(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(raw)) {
    // Upstash returns hashes as a flat [field, value, field, value] array.
    for (let i = 0; i + 1 < raw.length; i += 2) out[String(raw[i])] = toInt(raw[i + 1]);
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) out[k] = toInt(v);
  }
  return out;
}

/** Full stats for one code over the last `days` calendar days. */
export async function getCodeStats(code: string, days: number): Promise<CodeStats> {
  const dates = recentDates(days);
  const results = await pipeline([
    ["GET", `${KEY}:total:${code}`],
    ["PFCOUNT", `${KEY}:uniq:${code}`],
    ["HGETALL", `${KEY}:hour:${code}`],
    ["HGETALL", `${KEY}:weekday:${code}`],
    ["HGETALL", `${KEY}:device:${code}`],
    ["LRANGE", `${KEY}:recent:${code}`, 0, RECENT_LIMIT - 1],
    ["MGET", ...dates.map((d) => `${KEY}:day:${code}:${d}`)],
  ]);

  const [total, uniq, hourRaw, weekdayRaw, deviceRaw, recentRaw, dayRaw] = results;
  const dayCounts = Array.isArray(dayRaw) ? dayRaw.map(toInt) : dates.map(() => 0);
  const series = dates.map((date, i) => ({ date, count: dayCounts[i] ?? 0 }));

  const hours = hashToCounts(hourRaw);
  const weekdays = hashToCounts(weekdayRaw);
  const devices = hashToCounts(deviceRaw);

  const recent: ScanEvent[] = (Array.isArray(recentRaw) ? recentRaw : [])
    .map((raw) => {
      try {
        return JSON.parse(String(raw)) as ScanEvent;
      } catch {
        return null;
      }
    })
    .filter((e): e is ScanEvent => e !== null);

  return {
    code,
    total: toInt(total),
    uniqueDevices: toInt(uniq),
    series,
    windowTotal: series.reduce((sum, p) => sum + p.count, 0),
    last7: series.slice(-7).reduce((sum, p) => sum + p.count, 0),
    today: series[series.length - 1]?.count ?? 0,
    byHour: Array.from({ length: 24 }, (_, h) => hours[String(h)] ?? 0),
    byWeekday: Array.from({ length: 7 }, (_, d) => weekdays[String(d)] ?? 0),
    byDevice: {
      ios: devices.ios ?? 0,
      android: devices.android ?? 0,
      other: devices.other ?? 0,
    },
    recent,
  };
}

export async function getStatsForCodes(
  codes: string[],
  days: number,
): Promise<CodeStats[]> {
  return Promise.all(codes.map((code) => getCodeStats(code, days)));
}
