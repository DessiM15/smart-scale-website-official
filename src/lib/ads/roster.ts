/**
 * The advertiser roster for the Mex Taco House rotation.
 *
 * This is the internal book of record: who is running, on what package, since
 * when, which category they own, and who is waiting for a spot. It lives in
 * Redis rather than in code so it can be edited from /advertise/admin without a
 * deploy — unlike the QR link registry in ./advertisers, which stays in code
 * because a printed QR code should be governed by something reviewed.
 */

import { randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "./redis";
import { localStamp } from "./scan-store";

/** 18 slides in the loop; two are Mex Taco's own. */
export const SELLABLE_SLOTS = 16;

/** Terms are counted from the start date, in whole months. */
export type PlanId = "short" | "standard" | "annual" | "starter";

export type Plan = {
  id: PlanId;
  name: string;
  months: number;
  monthly: number;
  setup: number;
  /** Rep-only seeding tool — never shown on the public page. */
  internalOnly?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  short: { id: "short", name: "Short Term", months: 3, monthly: 500, setup: 99 },
  standard: { id: "standard", name: "Standard", months: 6, monthly: 450, setup: 0 },
  annual: { id: "annual", name: "Annual", months: 12, monthly: 375, setup: 0 },
  starter: {
    id: "starter",
    name: "Free Starter",
    months: 3,
    monthly: 0,
    setup: 0,
    internalOnly: true,
  },
};

export const PLAN_LIST = Object.values(PLANS);

export type AdvertiserStatus = "active" | "pending" | "ended";

export type Advertiser = {
  id: string;
  business: string;
  contactName: string;
  email: string;
  phone: string;
  /** The exclusivity category they own. One business per category. */
  category: string;
  plan: PlanId;
  /** YYYY-MM-DD, restaurant time. */
  startDate: string;
  status: AdvertiserStatus;
  /** Optional link to a code in ./advertisers, e.g. "plumb". */
  qrCode: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ProspectStatus = "new" | "contacted" | "hot" | "passed";

export type Prospect = {
  id: string;
  business: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  /** Where they came from — walk-in, referral, QR scan, cold call. */
  source: string;
  status: ProspectStatus;
  notes: string;
  addedAt: string;
  updatedAt: string;
};

/* ---------------------------------- dates --------------------------------- */

/** Today's calendar date in restaurant time. */
export function today(): string {
  return localStamp().date;
}

/**
 * Adds whole months to a YYYY-MM-DD date, clamping to the end of the target
 * month — so a term starting Jan 31 ends Feb 28, not Mar 3.
 */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1, 12));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`. Negative if `to` is in the past. */
export function daysBetween(from: string, to: string): number {
  const [ay, am, ad] = from.split("-").map(Number);
  const [by, bm, bd] = to.split("-").map(Number);
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000,
  );
}

export function formatDate(date: string): string {
  if (!date) return "—";
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/* -------------------------------- derived --------------------------------- */

export type AdvertiserView = Advertiser & {
  planName: string;
  monthly: number;
  endDate: string;
  daysRemaining: number;
  /** Term is up within 60 days and they're still active. */
  expiringSoon: boolean;
  /** Term end date has passed but nobody has marked them ended. */
  overdue: boolean;
};

export function toView(a: Advertiser, asOf = today()): AdvertiserView {
  const plan = PLANS[a.plan] ?? PLANS.standard;
  const endDate = addMonths(a.startDate, plan.months);
  const daysRemaining = daysBetween(asOf, endDate);
  return {
    ...a,
    planName: plan.name,
    monthly: plan.monthly,
    endDate,
    daysRemaining,
    expiringSoon:
      a.status === "active" && daysRemaining >= 0 && daysRemaining <= 60,
    overdue: a.status === "active" && daysRemaining < 0,
  };
}

export type RosterSummary = {
  active: number;
  pending: number;
  openSlots: number;
  /** Categories locked by an active advertiser. */
  takenCategories: string[];
  /** Active advertisers whose term ends within 60 days, soonest first. */
  expiring: AdvertiserView[];
  /** Active advertisers whose end date has already passed. */
  overdue: AdvertiserView[];
  monthlyRevenue: number;
  /** Contracted value still to be invoiced across every active term. */
  contractedRemaining: number;
};

export function summarize(views: AdvertiserView[]): RosterSummary {
  const active = views.filter((v) => v.status === "active");
  const pending = views.filter((v) => v.status === "pending");
  const byEndDate = (a: AdvertiserView, b: AdvertiserView) =>
    a.daysRemaining - b.daysRemaining;

  return {
    active: active.length,
    pending: pending.length,
    openSlots: Math.max(0, SELLABLE_SLOTS - active.length),
    takenCategories: [...new Set(active.map((v) => v.category).filter(Boolean))].sort(),
    expiring: active.filter((v) => v.expiringSoon).sort(byEndDate),
    overdue: active.filter((v) => v.overdue).sort(byEndDate),
    monthlyRevenue: active.reduce((sum, v) => sum + v.monthly, 0),
    contractedRemaining: active.reduce(
      (sum, v) => sum + v.monthly * Math.max(0, Math.ceil(v.daysRemaining / 30)),
      0,
    ),
  };
}

/**
 * Another active advertiser already owns this category. Exclusivity is the
 * thing we sell, so this is checked on every save rather than trusted.
 */
export function categoryConflict(
  views: AdvertiserView[],
  category: string,
  excludeId?: string,
): AdvertiserView | undefined {
  const wanted = category.trim().toLowerCase();
  if (!wanted) return undefined;
  return views.find(
    (v) =>
      v.status === "active" &&
      v.id !== excludeId &&
      v.category.trim().toLowerCase() === wanted,
  );
}

/* -------------------------------- storage --------------------------------- */

const ADVERTISER_KEY = (id: string) => `ads:advertiser:${id}`;
const ADVERTISER_INDEX = "ads:advertisers";
const PROSPECT_KEY = (id: string) => `ads:prospect:${id}`;
const PROSPECT_INDEX = "ads:prospects";

function parseAll<T>(raw: unknown): T[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      try {
        return entry ? (JSON.parse(String(entry)) as T) : null;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is T => entry !== null);
}

async function loadCollection<T>(
  indexKey: string,
  keyFor: (id: string) => string,
): Promise<T[]> {
  const [ids] = await redisPipeline([["SMEMBERS", indexKey]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list.map(keyFor)]]);
  return parseAll<T>(values);
}

export async function listAdvertisers(): Promise<AdvertiserView[]> {
  const raw = await loadCollection<Advertiser>(ADVERTISER_INDEX, ADVERTISER_KEY);
  const asOf = today();
  return raw
    .map((a) => toView(a, asOf))
    .sort((a, b) => a.business.localeCompare(b.business));
}

export async function getAdvertiser(id: string): Promise<Advertiser | null> {
  const [raw] = await redisPipeline([["GET", ADVERTISER_KEY(id)]]);
  if (!raw) return null;
  try {
    return JSON.parse(String(raw)) as Advertiser;
  } catch {
    return null;
  }
}

export type AdvertiserInput = Omit<Advertiser, "id" | "createdAt" | "updatedAt">;

export async function saveAdvertiser(
  input: AdvertiserInput,
  id?: string,
): Promise<{ ok: boolean; id: string }> {
  const now = new Date().toISOString();
  const existing = id ? await getAdvertiser(id) : null;
  const record: Advertiser = {
    ...input,
    id: existing?.id ?? id ?? newId(input.business),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const ok = await redisWrite([
    ["SET", ADVERTISER_KEY(record.id), JSON.stringify(record)],
    ["SADD", ADVERTISER_INDEX, record.id],
  ]);
  return { ok, id: record.id };
}

export async function deleteAdvertiser(id: string): Promise<boolean> {
  return redisWrite([
    ["DEL", ADVERTISER_KEY(id)],
    ["SREM", ADVERTISER_INDEX, id],
  ]);
}

export async function listProspects(): Promise<Prospect[]> {
  const raw = await loadCollection<Prospect>(PROSPECT_INDEX, PROSPECT_KEY);
  const rank: Record<ProspectStatus, number> = {
    hot: 0,
    contacted: 1,
    new: 2,
    passed: 3,
  };
  return raw.sort(
    (a, b) => rank[a.status] - rank[b.status] || b.addedAt.localeCompare(a.addedAt),
  );
}

export async function getProspect(id: string): Promise<Prospect | null> {
  const [raw] = await redisPipeline([["GET", PROSPECT_KEY(id)]]);
  if (!raw) return null;
  try {
    return JSON.parse(String(raw)) as Prospect;
  } catch {
    return null;
  }
}

export type ProspectInput = Omit<Prospect, "id" | "addedAt" | "updatedAt">;

export async function saveProspect(
  input: ProspectInput,
  id?: string,
): Promise<{ ok: boolean; id: string }> {
  const now = new Date().toISOString();
  const existing = id ? await getProspect(id) : null;
  const record: Prospect = {
    ...input,
    id: existing?.id ?? id ?? newId(input.business),
    addedAt: existing?.addedAt ?? now,
    updatedAt: now,
  };
  const ok = await redisWrite([
    ["SET", PROSPECT_KEY(record.id), JSON.stringify(record)],
    ["SADD", PROSPECT_INDEX, record.id],
  ]);
  return { ok, id: record.id };
}

export async function deleteProspect(id: string): Promise<boolean> {
  return redisWrite([
    ["DEL", PROSPECT_KEY(id)],
    ["SREM", PROSPECT_INDEX, id],
  ]);
}

/** Readable in a URL, unique enough, and stable once assigned. */
function newId(business: string): string {
  const slug = business
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
  return `${slug || "advertiser"}-${randomUUID().slice(0, 6)}`;
}

/**
 * A full snapshot, for the nightly backup and for anything that wants to move
 * this data somewhere else later. Keeping an export path from day one is what
 * makes "until we buy a system" true rather than aspirational.
 */
export async function exportRoster() {
  const [advertisers, prospects] = await Promise.all([
    listAdvertisers(),
    listProspects(),
  ]);
  return { exportedAt: new Date().toISOString(), advertisers, prospects };
}
