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
  /**
   * The client this code belongs to. Optional because Mex Taco's own codes
   * belong to nobody, and because codes created before ownership existed
   * are matched by the advertiser's legacy `qrCode` field instead.
   */
  advertiserId?: string;
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
  /** undefined leaves the owner alone; null unassigns it. */
  advertiserId?: string | null;
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
    advertiserId:
      input.advertiserId === null
        ? undefined
        : (input.advertiserId ?? existing?.advertiserId),
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
  return saveLink({
    ...link,
    active,
    logoDataUri: link.logoDataUri ?? null,
    advertiserId: link.advertiserId ?? null,
  });
}

/* ------------------------------ code naming ------------------------------- */

/**
 * A short code for a new client, derived from their business name.
 *
 * Prefers the first distinctive word — "Rio Plumbing & Air" becomes `rio` —
 * because a printed code is read aloud and typed by hand as often as it is
 * scanned. Falls back to the fuller slug when the first word is too generic to
 * stand alone, then to a numeric suffix when the name is already taken.
 *
 * The result is a suggestion. It is shown before anything is saved, because a
 * code is immutable once created and a bad auto-name would be permanent.
 */
const GENERIC_FIRST_WORDS = new Set([
  "the", "a", "an", "my", "your", "best", "big", "new", "all", "top", "pro",
]);

export function suggestCode(business: string, taken: Iterable<string>): string {
  const used = new Set([...taken].map((c) => c.toLowerCase()));

  const words = business
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);

  // "The Best Tacos" should suggest `tacos`, not `the-best` — filler words are
  // dropped before naming, and only put back if that leaves nothing at all.
  const meaningful = words.filter((w) => !GENERIC_FIRST_WORDS.has(w));
  const parts = meaningful.length > 0 ? meaningful : words;

  const tidy = (raw: string) => normalizeCode(raw).slice(0, 24).replace(/-+$/, "");

  const candidates = [
    parts[0] && parts[0].length >= 3 ? tidy(parts[0]) : "",
    parts.length > 1 ? tidy(parts.slice(0, 2).join("-")) : "",
    tidy(parts.join("-")),
  ].filter(Boolean);

  for (const code of candidates) {
    if (CODE_PATTERN.test(code) && !used.has(code)) return code;
  }

  // Everything sensible is taken, so number it. Trimmed to leave room for the
  // suffix without overrunning the 24-character limit.
  const base = candidates.find((c) => CODE_PATTERN.test(c)) ?? "ad";
  for (let n = 2; n < 100; n += 1) {
    const code = `${base.slice(0, 21).replace(/-+$/, "")}-${n}`;
    if (!used.has(code)) return code;
  }
  return `${base.slice(0, 21).replace(/-+$/, "")}-99`;
}

/**
 * Every code belonging to one client.
 *
 * Ownership is recorded on the link, but records created before that existed
 * are matched through the advertiser's own `qrCode` field — so an old roster
 * keeps working without a migration, and claiming the code on next save fixes
 * it for good.
 */
export function linksForAdvertiser(
  links: AdLinkRecord[],
  advertiserId: string,
  legacyCode?: string,
): AdLinkRecord[] {
  const legacy = legacyCode ? normalizeCode(legacyCode) : "";
  return links.filter(
    (link) => link.advertiserId === advertiserId || (legacy && link.code === legacy),
  );
}

/**
 * A code for an extra placement belonging to a client who already has one.
 *
 * Reads as `rio-flyer` rather than `rio-2`, because the whole reason for a
 * second code is telling placements apart — and a name that says which one it
 * is survives being printed, filed and asked about six months later.
 */
export function suggestPlacementCode(
  base: string,
  label: string,
  taken: Iterable<string>,
): string {
  const used = new Set([...taken].map((c) => c.toLowerCase()));

  // Just the first meaningful word of the label: "Window cling" is `window`.
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w && !GENERIC_FIRST_WORDS.has(w))[0];

  if (slug) {
    const candidate = normalizeCode(`${base}-${slug}`)
      .slice(0, 24)
      .replace(/-+$/, "");
    if (CODE_PATTERN.test(candidate) && !used.has(candidate)) return candidate;
  }

  // No usable label, or that name is already out in the world — fall back to
  // the ordinary rule, which numbers it.
  return suggestCode(label ? `${base} ${label}` : base, used);
}

/**
 * Just the code names belonging to one client, for the places that need to
 * total a client's scans and don't otherwise care about the link records.
 */
export async function codesForAdvertiser(
  advertiserId: string,
  legacyCode?: string,
): Promise<string[]> {
  const links = await listLinks();
  return linksForAdvertiser(links, advertiserId, legacyCode).map((l) => l.code);
}
