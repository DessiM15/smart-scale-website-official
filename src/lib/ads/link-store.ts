/**
 * QR links, managed from the tracker.
 *
 * These used to live in code because a printed QR is permanent and a typo in a
 * destination is unfixable once the artwork is on a screen. Managing them from
 * the browser keeps that risk, so it is handled rather than avoided:
 *
 *   - The `code` is immutable once created. It is the part that gets printed.
 *   - The `destination` stays editable forever, which is the whole point of
 *     owning the redirect — an ad can be repointed after it is on the wall.
 *   - Codes are never deleted, only deactivated, so a retired QR still lands
 *     somewhere sensible instead of 404ing.
 *
 * The static list in ./advertisers stays as a seed and a fallback, so the
 * redirect keeps working even if the database is unreachable.
 */

import { redisPipeline, redisWrite } from "./redis";
import { AD_LINKS as SEED_LINKS, FALLBACK_DESTINATION } from "./advertisers";

export { FALLBACK_DESTINATION };

export type AdLinkRecord = {
  /** The bit after /go/. Lowercase, immutable once created. */
  code: string;
  /** Who or what it's for, shown in the tracker. */
  label: string;
  destination: string;
  active: boolean;
  /** Append utm_* so the advertiser sees the traffic in their own analytics. */
  tagDestination: boolean;
  /** Optional logo for the middle of the QR, stored as a data URI. */
  logoDataUri?: string;
  createdAt: string;
  updatedAt: string;
};

const KEY = (code: string) => `ads:link:${code}`;
const INDEX = "ads:links";

/** Short, lowercase, URL-safe. Kept tight so the printed QR stays sparse. */
export const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,23}$/;

export function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function validateCode(code: string): string | null {
  if (!code) return "Give the code a name — it's the bit after /go/.";
  if (!CODE_PATTERN.test(code)) {
    return "Use 2–24 characters: lowercase letters, numbers and dashes only.";
  }
  return null;
}

export function validateDestination(raw: string): string | null {
  if (!raw) return "Where should the scan go? Paste the full web address.";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "That doesn't look like a web address. Include https:// at the front.";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "The address must start with https://.";
  }
  return null;
}

/* --------------------------------- reading -------------------------------- */

function parse(raw: unknown): AdLinkRecord | null {
  try {
    return raw ? (JSON.parse(String(raw)) as AdLinkRecord) : null;
  } catch {
    return null;
  }
}

/** Seed entries presented in the same shape, so callers don't special-case them. */
function seedAsRecords(): AdLinkRecord[] {
  return SEED_LINKS.map((link) => ({
    code: link.code,
    label: link.advertiser,
    destination: link.destination,
    active: link.active,
    tagDestination: link.tagDestination !== false,
    createdAt: link.startedOn ?? "",
    updatedAt: link.startedOn ?? "",
  }));
}

export async function listLinks(): Promise<AdLinkRecord[]> {
  const [codes] = await redisPipeline([["SMEMBERS", INDEX]]);
  const list = Array.isArray(codes) ? codes.map(String) : [];
  const stored = list.length
    ? (((await redisPipeline([["MGET", ...list.map(KEY)]]))[0] as unknown[]) ?? [])
        .map(parse)
        .filter((l): l is AdLinkRecord => l !== null)
    : [];

  // Stored records win over seeds of the same code.
  const byCode = new Map(seedAsRecords().map((l) => [l.code, l]));
  for (const link of stored) byCode.set(link.code, link);

  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export async function getLink(code: string): Promise<AdLinkRecord | null> {
  const wanted = normalizeCode(code);
  if (!wanted) return null;
  const [raw] = await redisPipeline([["GET", KEY(wanted)]]);
  const stored = parse(raw);
  if (stored) return stored;
  return seedAsRecords().find((l) => l.code === wanted) ?? null;
}

/** The seed list only — used when the database can't be reached. */
export function getSeedLink(code: string): AdLinkRecord | null {
  const wanted = normalizeCode(code);
  return seedAsRecords().find((l) => l.code === wanted) ?? null;
}

/**
 * Where a scan should actually land, with campaign tags attached so the
 * advertiser can see the traffic in their own analytics.
 */
export function resolveDestination(link: AdLinkRecord): string {
  if (!link.tagDestination) return link.destination;
  try {
    const url = new URL(link.destination);
    if (!url.searchParams.has("utm_source")) {
      url.searchParams.set("utm_source", "mex-taco-house");
      url.searchParams.set("utm_medium", "qr-instore-screen");
      url.searchParams.set("utm_campaign", link.code);
    }
    return url.toString();
  } catch {
    return link.destination;
  }
}

/* --------------------------------- writing -------------------------------- */

export type LinkInput = {
  code: string;
  label: string;
  destination: string;
  active: boolean;
  tagDestination: boolean;
  /** undefined leaves an existing logo alone; null clears it. */
  logoDataUri?: string | null;
};

export async function saveLink(input: LinkInput): Promise<boolean> {
  const code = normalizeCode(input.code);
  const existing = await getLink(code);
  const now = new Date().toISOString();

  const record: AdLinkRecord = {
    code,
    label: input.label,
    destination: input.destination,
    active: input.active,
    tagDestination: input.tagDestination,
    logoDataUri:
      input.logoDataUri === null
        ? undefined
        : (input.logoDataUri ?? existing?.logoDataUri),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  return redisWrite([
    ["SET", KEY(code), JSON.stringify(record)],
    ["SADD", INDEX, code],
  ]);
}

/**
 * Codes are retired, not removed — a QR already printed must keep resolving
 * somewhere sensible rather than dying. Deactivating sends it to the advertise
 * page and keeps its scan history.
 */
export async function setLinkActive(
  code: string,
  active: boolean,
): Promise<boolean> {
  const link = await getLink(code);
  if (!link) return false;
  return saveLink({ ...link, active, logoDataUri: link.logoDataUri ?? null });
}
