/**
 * Campaigns: anything printed with a QR on it.
 *
 * A flyer run, the car magnets, business cards, a yard sign. Each campaign
 * belongs to a client (Smart Scale itself is one, built in) and holds
 * placements: one per code, with how many were printed and what they cost,
 * so scans turn into cost per scan, which is the number that says whether a
 * thing was worth doing again.
 *
 * Codes ride the same /go/ links the screens use, so a placement inherits
 * bot filtering, unique-phone counting, test-scan baselines and the rule that
 * a printed code is never deleted. What this module adds is the grouping and
 * the money; the counting is still ./scan-store.
 */

import { randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "./redis";

/* --------------------------------- media ---------------------------------- */

export type CampaignMedium = "flyer" | "car-magnet" | "business-card" | "yard-sign" | "sticker" | "table-tent" | "poster" | "other";

export const MEDIA: { id: CampaignMedium; label: string; utmMedium: string; placementNoun: string }[] = [
  { id: "flyer", label: "Flyer", utmMedium: "flyer", placementNoun: "drop" },
  { id: "car-magnet", label: "Car magnet", utmMedium: "car-magnet", placementNoun: "vehicle" },
  { id: "business-card", label: "Business card", utmMedium: "business-card", placementNoun: "batch" },
  { id: "yard-sign", label: "Yard sign", utmMedium: "yard-sign", placementNoun: "sign" },
  { id: "sticker", label: "Sticker", utmMedium: "sticker", placementNoun: "batch" },
  { id: "table-tent", label: "Table tent", utmMedium: "table-tent", placementNoun: "table" },
  { id: "poster", label: "Poster", utmMedium: "poster", placementNoun: "spot" },
  { id: "other", label: "Something else", utmMedium: "print", placementNoun: "placement" },
];

export function mediumOf(id: string) {
  return MEDIA.find((m) => m.id === id) ?? MEDIA[MEDIA.length - 1];
}

/* --------------------------------- clients -------------------------------- */

export type CampaignClient = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  /** Smart Scale's own. Always present, never deleted. */
  builtIn?: boolean;
  createdAt: string;
  updatedAt: string;
};

export const SMART_SCALE_CLIENT_ID = "smart-scale";

function houseClient(): CampaignClient {
  return {
    id: SMART_SCALE_CLIENT_ID,
    name: "Smart Scale",
    contactName: "",
    email: "",
    phone: "",
    notes: "Our own marketing: the website business and the screens.",
    builtIn: true,
    createdAt: "",
    updatedAt: "",
  };
}

const CLIENT_KEY = (id: string) => `ads:cclient:${id}`;
const CLIENT_INDEX = "ads:cclients";

export type CampaignStatus = "draft" | "live" | "ended";

export const CAMPAIGN_STATUSES: { id: CampaignStatus; label: string }[] = [
  { id: "draft", label: "Getting ready" },
  { id: "live", label: "Out in the world" },
  { id: "ended", label: "Ended" },
];

export type Campaign = {
  id: string;
  clientId: string;
  name: string;
  medium: CampaignMedium;
  status: CampaignStatus;
  /** YYYY-MM-DD. When it went out, or will. */
  startDate: string;
  /** Blank while it is still out there. A magnet is out for years. */
  endDate: string;
  /** Where every code in the campaign sends people, unless a placement says otherwise. */
  destination: string;
  tagDestination: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const CAMPAIGN_KEY = (id: string) => `ads:campaign:${id}`;
const CAMPAIGN_INDEX = "ads:campaigns";

export type Placement = {
  id: string;
  campaignId: string;
  /** "Dessi's car", "Katy drop", "Batch of 500". */
  label: string;
  /** The /go/ code. Immutable, like every code. */
  code: string;
  /** How many were printed, or how many vehicles, or blank. */
  quantity: number | null;
  /** What this placement cost to make, in dollars. */
  cost: number | null;
  note: string;
  createdAt: string;
};

const PLACEMENT_KEY = (id: string) => `ads:placement:${id}`;
const PLACEMENT_INDEX = (campaignId: string) => `ads:placements:${campaignId}`;

/* ---------------------------------- reads --------------------------------- */

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

async function loadCollection<T>(indexKey: string, keyFor: (id: string) => string): Promise<T[]> {
  const [ids] = await redisPipeline([["SMEMBERS", indexKey]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list.map(keyFor)]]);
  return parseAll<T>(values);
}

/** Smart Scale first, then everyone else by name. */
export async function listCampaignClients(): Promise<CampaignClient[]> {
  const stored = await loadCollection<CampaignClient>(CLIENT_INDEX, CLIENT_KEY);
  const byId = new Map(stored.map((c) => [c.id, c]));
  if (!byId.has(SMART_SCALE_CLIENT_ID)) byId.set(SMART_SCALE_CLIENT_ID, houseClient());
  return [...byId.values()].sort((a, b) => {
    if (a.id === SMART_SCALE_CLIENT_ID) return -1;
    if (b.id === SMART_SCALE_CLIENT_ID) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getCampaignClient(id: string): Promise<CampaignClient | null> {
  if (id === SMART_SCALE_CLIENT_ID) {
    const [raw] = await redisPipeline([["GET", CLIENT_KEY(id)]]);
    try {
      return raw ? { ...houseClient(), ...(JSON.parse(String(raw)) as CampaignClient), builtIn: true } : houseClient();
    } catch {
      return houseClient();
    }
  }
  const [raw] = await redisPipeline([["GET", CLIENT_KEY(id)]]);
  try {
    return raw ? (JSON.parse(String(raw)) as CampaignClient) : null;
  } catch {
    return null;
  }
}

/** Newest first. */
export async function listCampaigns(): Promise<Campaign[]> {
  const all = await loadCollection<Campaign>(CAMPAIGN_INDEX, CAMPAIGN_KEY);
  const rank: Record<CampaignStatus, number> = { live: 0, draft: 1, ended: 2 };
  return all.sort((a, b) => rank[a.status] - rank[b.status] || b.startDate.localeCompare(a.startDate) || b.createdAt.localeCompare(a.createdAt));
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", CAMPAIGN_KEY(id)]]);
  try {
    return raw ? (JSON.parse(String(raw)) as Campaign) : null;
  } catch {
    return null;
  }
}

/** Oldest first: the order they were made is the order they are printed on the sheet. */
export async function listPlacements(campaignId: string): Promise<Placement[]> {
  const all = await loadCollection<Placement>(PLACEMENT_INDEX(campaignId), PLACEMENT_KEY);
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Every placement across every campaign, keyed by campaign. One round trip per campaign. */
export async function listAllPlacements(campaigns: Campaign[]): Promise<Map<string, Placement[]>> {
  const lists = await Promise.all(campaigns.map((c) => listPlacements(c.id)));
  const map = new Map<string, Placement[]>();
  campaigns.forEach((c, i) => map.set(c.id, lists[i]));
  return map;
}

export async function getPlacement(id: string): Promise<Placement | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", PLACEMENT_KEY(id)]]);
  try {
    return raw ? (JSON.parse(String(raw)) as Placement) : null;
  } catch {
    return null;
  }
}

/* --------------------------------- writes --------------------------------- */

function newId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
  return `${slug || "campaign"}-${randomUUID().slice(0, 6)}`;
}

export type CampaignClientInput = Omit<CampaignClient, "id" | "builtIn" | "createdAt" | "updatedAt">;

export async function saveCampaignClient(input: CampaignClientInput, id?: string): Promise<{ ok: boolean; id: string }> {
  const now = new Date().toISOString();
  const existing = id ? await getCampaignClient(id) : null;
  const record: CampaignClient = {
    ...(existing ?? {}),
    ...input,
    id: existing?.id ?? id ?? newId(input.name),
    name: input.name.trim() || existing?.name || "Client",
    builtIn: existing?.builtIn,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const ok = await redisWrite([
    ["SET", CLIENT_KEY(record.id), JSON.stringify(record)],
    ["SADD", CLIENT_INDEX, record.id],
  ]);
  return { ok, id: record.id };
}

export type CampaignInput = Omit<Campaign, "id" | "createdAt" | "updatedAt">;

export function validateCampaign(input: CampaignInput): string | null {
  if (!input.name.trim()) return "Give the campaign a name.";
  if (!input.clientId) return "Whose campaign is it?";
  if (!MEDIA.some((m) => m.id === input.medium)) return "What is it printed on?";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) return "When does it go out? Give a date.";
  if (input.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) return "The end date isn't a date.";
  if (input.endDate && input.endDate < input.startDate) return "It can't end before it starts.";
  return null;
}

export async function saveCampaign(input: CampaignInput, id?: string): Promise<{ ok: boolean; id: string; error?: string }> {
  const invalid = validateCampaign(input);
  if (invalid) return { ok: false, id: id ?? "", error: invalid };
  const now = new Date().toISOString();
  const existing = id ? await getCampaign(id) : null;
  if (id && !existing) return { ok: false, id, error: "That campaign no longer exists." };
  const record: Campaign = {
    ...(existing ?? {}),
    ...input,
    id: existing?.id ?? newId(input.name),
    name: input.name.trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const ok = await redisWrite([
    ["SET", CAMPAIGN_KEY(record.id), JSON.stringify(record)],
    ["SADD", CAMPAIGN_INDEX, record.id],
  ]);
  return { ok, id: record.id };
}

export async function setCampaignStatus(id: string, status: CampaignStatus): Promise<boolean> {
  const campaign = await getCampaign(id);
  if (!campaign) return false;
  const result = await saveCampaign({ ...campaign, status }, id);
  return result.ok;
}

export type PlacementInput = Omit<Placement, "id" | "createdAt">;

export async function addPlacement(input: PlacementInput): Promise<{ ok: boolean; id: string }> {
  const record: Placement = {
    ...input,
    id: randomUUID().slice(0, 8),
    label: input.label.trim().slice(0, 120),
    note: input.note.slice(0, 400),
    createdAt: new Date().toISOString(),
  };
  const ok = await redisWrite([
    ["SET", PLACEMENT_KEY(record.id), JSON.stringify(record)],
    ["SADD", PLACEMENT_INDEX(record.campaignId), record.id],
  ]);
  return { ok, id: record.id };
}

/** Quantity, cost, label and note can change. The code cannot: it is printed. */
export async function updatePlacement(id: string, patch: Partial<Omit<Placement, "id" | "code" | "campaignId" | "createdAt">>): Promise<boolean> {
  const existing = await getPlacement(id);
  if (!existing) return false;
  const record: Placement = { ...existing, ...patch, id: existing.id, code: existing.code, campaignId: existing.campaignId, createdAt: existing.createdAt };
  return redisWrite([["SET", PLACEMENT_KEY(id), JSON.stringify(record)]]);
}

/**
 * Takes the placement off the campaign. The code itself stays in the
 * registry with its history, because it may already be printed; it just
 * stops being counted here.
 */
export async function removePlacement(id: string): Promise<Placement | null> {
  const existing = await getPlacement(id);
  if (!existing) return null;
  const ok = await redisWrite([
    ["DEL", PLACEMENT_KEY(id)],
    ["SREM", PLACEMENT_INDEX(existing.campaignId), id],
  ]);
  return ok ? existing : null;
}

/* --------------------------------- figures -------------------------------- */

export type PlacementFigures = {
  placement: Placement;
  scans: number;
  uniquePhones: number;
  /** Contact-form submissions that followed a scan of this code. */
  leads: number;
  /** Dollars per scan, when both cost and scans are known. */
  costPerScan: number | null;
  /** Scans per hundred printed, when a quantity is known. */
  scanRate: number | null;
};

export function placementFigures(placement: Placement, scans: number, uniquePhones: number, leads: number): PlacementFigures {
  const cost = placement.cost;
  const quantity = placement.quantity;
  return {
    placement,
    scans,
    uniquePhones,
    leads,
    costPerScan: cost !== null && cost > 0 && scans > 0 ? Math.round((cost / scans) * 100) / 100 : null,
    scanRate: quantity !== null && quantity > 0 ? Math.round((scans / quantity) * 1000) / 10 : null,
  };
}

/** The campaign's totals, from its placements' figures. */
export function campaignTotals(rows: PlacementFigures[]) {
  const scans = rows.reduce((sum, r) => sum + r.scans, 0);
  const leads = rows.reduce((sum, r) => sum + r.leads, 0);
  const cost = rows.reduce((sum, r) => sum + (r.placement.cost ?? 0), 0);
  const printed = rows.reduce((sum, r) => sum + (r.placement.quantity ?? 0), 0);
  return {
    scans,
    leads,
    cost,
    printed,
    costPerScan: cost > 0 && scans > 0 ? Math.round((cost / scans) * 100) / 100 : null,
    costPerLead: cost > 0 && leads > 0 ? Math.round((cost / leads) * 100) / 100 : null,
  };
}

/** Everything, for the nightly backup. */
export async function exportCampaigns() {
  const [clients, campaigns] = await Promise.all([listCampaignClients(), listCampaigns()]);
  const placements = await listAllPlacements(campaigns);
  return { clients, campaigns, placements: [...placements.values()].flat() };
}
