/**
 * Scan storage for QR redirects, backed by Upstash Redis.
 *
 * Degrades safely — if the database isn't configured the redirect still works,
 * it just doesn't count. A guest scanning an ad must never see an error because
 * our analytics is down. The transport lives in ./redis.
 */

import { createHash } from "crypto";
import {
  redisPipeline,
  redisWrite,
  isRedisConfigured,
  type RedisCommand,
} from "./redis";

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

/**
 * A readable place from the two headers the edge sends.
 *
 * Vercel URL-encodes the city, so "San Antonio" arrives as "San%20Antonio".
 * That went unnoticed while the value only ever sat in the recent-activity
 * list; the moment it is counted and shown to an advertiser it has to be
 * decoded, or a report tells them their best town is called San%20Antonio.
 */
export function placeName(city?: string, region?: string): string {
  const decode = (value?: string) => {
    if (!value) return "";
    try {
      return decodeURIComponent(value).trim();
    } catch {
      return value.trim();
    }
  };
  const town = decode(city);
  const area = decode(region);
  if (!town) return "";
  return area ? `${town}, ${area}` : town;
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

  const place = placeName(input.city, input.region);

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
    // Counted for the life of the code rather than per day: an advertiser
    // wants to know which towns their ad reaches, and a per-day breakdown of
    // that would be a key per town per day for a question nobody asks.
    ...(place
      ? ([["HINCRBY", `${KEY}:place:${code}`, place, 1]] as RedisCommand[])
      : []),
  ]);
}

/* -------------------------------- test scans ------------------------------- */

/**
 * A line drawn under everything a code had counted at one moment.
 *
 * Setting up a client means scanning their own QR a few times to check the
 * artwork and the destination, and those scans are indistinguishable from a
 * guest's: same redirect, same counter. Left alone they sit in the client's
 * first report and in their whole-term totals for good, which is a small lie
 * told to the one person paying to be told the truth.
 *
 * Deleting them is not an option — the counters are the record, and a code that
 * has been reset can never be audited. So the scans stay exactly where they
 * are and a baseline is stored beside them; every read subtracts it. The raw
 * figures remain recoverable, and clearing the baseline puts everything back.
 *
 * Stored per day rather than as a single number so that real scans on the same
 * day as a test are still counted — a code is usually tested on the day it goes
 * live, which is also the day it might first be scanned for real.
 */
export type TestBaseline = {
  /** When the line was drawn. Recent events older than this are hidden too. */
  at: string;
  total: number;
  unique: number;
  days: Record<string, number>;
  byHour: number[];
  byWeekday: number[];
  byDevice: Record<DeviceKind, number>;
  /** Absent on baselines drawn before places were counted. */
  byPlace?: Record<string, number>;
};

const BASELINE_KEY = (code: string) => `${KEY}:testbase:${code}`;
/** Wide enough to capture every day counter that still exists. */
const BASELINE_WINDOW = 400;

function parseBaseline(raw: unknown): TestBaseline | null {
  try {
    return raw ? (JSON.parse(String(raw)) as TestBaseline) : null;
  } catch {
    return null;
  }
}

export async function getTestBaseline(code: string): Promise<TestBaseline | null> {
  const [raw] = await pipeline([["GET", BASELINE_KEY(code)]]);
  return parseBaseline(raw);
}

/**
 * Treat everything counted so far on this code as testing.
 *
 * Called again later it simply moves the line forward, which is what "these
 * were tests" means the second time too.
 */
export async function markScansAsTests(
  code: string,
): Promise<{ ok: boolean; excluded: number }> {
  // Read past any existing baseline: this draws a fresh line under everything.
  const raw = await getCodeStats(code, BASELINE_WINDOW, { includeTests: true });

  const days: Record<string, number> = {};
  for (const point of raw.series) {
    if (point.count > 0) days[point.date] = point.count;
  }

  const baseline: TestBaseline = {
    at: new Date().toISOString(),
    total: raw.total,
    unique: raw.uniqueDevices,
    days,
    byHour: raw.byHour,
    byWeekday: raw.byWeekday,
    byDevice: raw.byDevice,
    byPlace: Object.fromEntries(raw.byPlace.map((p) => [p.name, p.count])),
  };

  // No expiry: the line has to outlive the day counters it describes.
  const ok = await redisWrite([
    ["SET", BASELINE_KEY(code), JSON.stringify(baseline)],
  ]);
  return { ok, excluded: raw.total };
}

/** Put the excluded scans back — for a line drawn by mistake. */
export async function clearTestBaseline(code: string): Promise<boolean> {
  return redisWrite([["DEL", BASELINE_KEY(code)]]);
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
  /** Towns the scans came from, busiest first. Empty before any were recorded. */
  byPlace: { name: string; count: number }[];
  recent: ScanEvent[];
  /** Scans held back as testing. Every figure above is already net of these. */
  testScans: number;
  /** Distinct phones behind those test scans, for correcting a union count. */
  testUniqueDevices: number;
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

/** Never let a subtraction produce a negative count. */
const net = (value: number, taken = 0) => Math.max(0, value - taken);

/** Towns busiest first, with any test scans taken back out. */
function rankPlaces(
  counts: Record<string, number>,
  excluded?: Record<string, number>,
): { name: string; count: number }[] {
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count: net(count, excluded?.[name]) }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export type StatsOptions = {
  /** Report the raw counters, ignoring any test baseline. */
  includeTests?: boolean;
};

/**
 * Full stats for one code over the last `days` calendar days.
 *
 * Net of scans marked as testing, unless asked otherwise. Doing the subtraction
 * here rather than at each call site is deliberate: reports, the venue
 * statement, renewal emails, the client profile and the registry all read
 * through this one function, and a correction applied anywhere else would be a
 * correction some of them quietly missed.
 */
export async function getCodeStats(
  code: string,
  days: number,
  options: StatsOptions = {},
): Promise<CodeStats> {
  const dates = recentDates(days);
  const results = await pipeline([
    ["GET", `${KEY}:total:${code}`],
    ["PFCOUNT", `${KEY}:uniq:${code}`],
    ["HGETALL", `${KEY}:hour:${code}`],
    ["HGETALL", `${KEY}:weekday:${code}`],
    ["HGETALL", `${KEY}:device:${code}`],
    ["LRANGE", `${KEY}:recent:${code}`, 0, RECENT_LIMIT - 1],
    ["MGET", ...dates.map((d) => `${KEY}:day:${code}:${d}`)],
    ["GET", BASELINE_KEY(code)],
    ["HGETALL", `${KEY}:place:${code}`],
  ]);

  const [
    total,
    uniq,
    hourRaw,
    weekdayRaw,
    deviceRaw,
    recentRaw,
    dayRaw,
    baseRaw,
    placeRaw,
  ] = results;
  const base = options.includeTests ? null : parseBaseline(baseRaw);

  const dayCounts = Array.isArray(dayRaw) ? dayRaw.map(toInt) : dates.map(() => 0);
  const series = dates.map((date, i) => ({
    date,
    count: net(dayCounts[i] ?? 0, base?.days[date]),
  }));

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
    .filter((e): e is ScanEvent => e !== null)
    // Events carry their own timestamp, so the activity feed can be filtered
    // exactly rather than by subtracting a count from it.
    .filter((e) => !base || e.t >= base.at);

  return {
    code,
    total: net(toInt(total), base?.total),
    // A HyperLogLog cannot have members removed, so this is the one figure that
    // is corrected by arithmetic rather than exactly. Subtracting the count at
    // the baseline errs low when a test phone later scans for real, which is
    // the safe direction for a number shown to a paying client.
    uniqueDevices: net(toInt(uniq), base?.unique),
    series,
    windowTotal: series.reduce((sum, p) => sum + p.count, 0),
    last7: series.slice(-7).reduce((sum, p) => sum + p.count, 0),
    today: series[series.length - 1]?.count ?? 0,
    byHour: Array.from({ length: 24 }, (_, h) =>
      net(hours[String(h)] ?? 0, base?.byHour?.[h]),
    ),
    byWeekday: Array.from({ length: 7 }, (_, d) =>
      net(weekdays[String(d)] ?? 0, base?.byWeekday?.[d]),
    ),
    byDevice: {
      ios: net(devices.ios ?? 0, base?.byDevice?.ios),
      android: net(devices.android ?? 0, base?.byDevice?.android),
      other: net(devices.other ?? 0, base?.byDevice?.other),
    },
    byPlace: rankPlaces(hashToCounts(placeRaw), base?.byPlace),
    recent,
    testScans: base?.total ?? 0,
    testUniqueDevices: base?.unique ?? 0,
  };
}

export async function getStatsForCodes(
  codes: string[],
  days: number,
  options: StatsOptions = {},
): Promise<CodeStats[]> {
  return Promise.all(codes.map((code) => getCodeStats(code, days, options)));
}

/**
 * One client's codes added together, presented as if they were a single code.
 *
 * A client can own several placements — a screen ad, a flyer, a table tent —
 * and everything customer-facing talks about "your scans", singular. Reporting
 * only the first code would quietly undercount the very thing they're paying
 * for.
 *
 * Unique phones are counted with a single PFCOUNT across every code's
 * HyperLogLog, which unions them properly. Adding the per-code figures instead
 * would count one person twice for scanning two of their codes.
 */
export async function getCombinedStats(
  codes: string[],
  days: number,
  options: StatsOptions = {},
): Promise<CodeStats> {
  const unique = [...new Set(codes.filter(Boolean))];

  if (unique.length === 0) {
    const dates = recentDates(days);
    return {
      code: "",
      total: 0,
      uniqueDevices: 0,
      series: dates.map((date) => ({ date, count: 0 })),
      windowTotal: 0,
      last7: 0,
      today: 0,
      byHour: Array.from({ length: 24 }, () => 0),
      byWeekday: Array.from({ length: 7 }, () => 0),
      byDevice: { ios: 0, android: 0, other: 0 },
      byPlace: [],
      recent: [],
      testScans: 0,
      testUniqueDevices: 0,
    };
  }

  if (unique.length === 1) return getCodeStats(unique[0], days, options);

  const [parts, unionRaw] = await Promise.all([
    getStatsForCodes(unique, days, options),
    pipeline([["PFCOUNT", ...unique.map((c) => `${KEY}:uniq:${c}`)]]),
  ]);

  const first = parts[0];
  const sumAt = (pick: (s: CodeStats) => number[], i: number) =>
    parts.reduce((sum, s) => sum + (pick(s)[i] ?? 0), 0);

  // The union is a raw PFCOUNT across every code, so it still contains the
  // testers that each part has already had removed. Subtracting each code's
  // excluded phones double-counts a tester who scanned two of them, which errs
  // low — the safe direction for a figure a client is shown.
  const unionCount = net(
    toInt(unionRaw[0]),
    parts.reduce((sum, s) => sum + s.testUniqueDevices, 0),
  );

  return {
    // Not a real code — this is several of them. Callers show the client's
    // name, not this.
    code: unique.join("+"),
    total: parts.reduce((sum, s) => sum + s.total, 0),
    // Fall back to the per-code sum only if the union query came back empty.
    uniqueDevices:
      unionCount || parts.reduce((sum, s) => sum + s.uniqueDevices, 0),
    series: first.series.map((point, i) => ({
      date: point.date,
      count: sumAt((s) => s.series.map((p) => p.count), i),
    })),
    windowTotal: parts.reduce((sum, s) => sum + s.windowTotal, 0),
    last7: parts.reduce((sum, s) => sum + s.last7, 0),
    today: parts.reduce((sum, s) => sum + s.today, 0),
    byHour: Array.from({ length: 24 }, (_, i) => sumAt((s) => s.byHour, i)),
    byWeekday: Array.from({ length: 7 }, (_, i) => sumAt((s) => s.byWeekday, i)),
    byDevice: {
      ios: parts.reduce((sum, s) => sum + s.byDevice.ios, 0),
      android: parts.reduce((sum, s) => sum + s.byDevice.android, 0),
      other: parts.reduce((sum, s) => sum + s.byDevice.other, 0),
    },
    byPlace: rankPlaces(
      parts.reduce<Record<string, number>>((all, part) => {
        for (const place of part.byPlace) {
          all[place.name] = (all[place.name] ?? 0) + place.count;
        }
        return all;
      }, {}),
    ),
    // Newest first across every code, so "recent activity" reads as one stream.
    recent: parts
      .flatMap((s) => s.recent)
      .sort((a, b) => b.t.localeCompare(a.t))
      .slice(0, RECENT_LIMIT),
    testScans: parts.reduce((sum, s) => sum + s.testScans, 0),
    testUniqueDevices: parts.reduce((sum, s) => sum + s.testUniqueDevices, 0),
  };
}
