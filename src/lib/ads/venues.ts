/**
 * The locations whose screens carry the ads.
 *
 * Mex Taco House was the only one and lived in code. A second is coming, and
 * Dessi and Jay want to set it up themselves the day it signs, so locations
 * are records now: name, where it is, how many screens and slides, when it
 * is open, who owns it, and the deal with them (rent, a share of what is
 * collected, or both, and the day it falls due). Everything that used to read
 * a constant reads the record instead, so a location's hours and slot count
 * are its own.
 *
 * Mex Taco House stays built in: it is always in the list, even on an empty
 * database, so the roster has somewhere to belong. Saving it writes a record
 * that then wins over the seed, which is how its deal gets filled in.
 */

import { redisPipeline, redisWrite } from "./redis";
import { getSettings } from "./settings";

export type VenueStatus = "live" | "pending" | "ended";

/** Opening hours for one weekday, "HH:MM" on a 24-hour clock, or closed. */
export type DayHours = { open: string; close: string } | null;

export type VenueDeal = {
  /** Fixed rent to the venue each month, in dollars. Zero if there is none. */
  rentMonthly: number;
  /** The venue's cut of money collected from its advertisers, as a percentage. */
  sharePercent: number;
  /** Day of the month the rent, or the share for the previous month, is due. 1 to 28. */
  dueDay: number;
  /** The deal in words: a trade, a stepped rate, a handshake. */
  note: string;
};

export type Venue = {
  id: string;
  name: string;
  /** Shown under the name in the switcher: "Cypress, TX". */
  place: string;
  address: string;
  status: VenueStatus;
  /** Physical screens in the room. Informational. */
  screens: number;
  /** Slides in the loop, and how many of them are for sale. */
  slides: number;
  sellable: number;
  /** How long each slide holds. */
  slideSeconds: number;
  /** Seven entries, Sunday first. */
  hours: DayHours[];
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  deal: VenueDeal;
  /** What the venue is called in the utm_source on its advertisers' links. */
  utmSource: string;
  notes: string;
  /** The seed. Cannot be deleted; can be edited. */
  builtIn?: boolean;
  createdAt: string;
  updatedAt: string;
};

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const VENUE_STATUSES: { id: VenueStatus; label: string; hint: string }[] = [
  { id: "pending", label: "Not live yet", hint: "In talks or signed. Pipeline only; nothing can run on its screens." },
  { id: "live", label: "Live", hint: "Screens are up and ads can run." },
  { id: "ended", label: "Ended", hint: "No longer a partner. Kept for the history." },
];

const MEX_TACO_ID = "mex-taco-house";

/** Six to two, Tuesday through Saturday; seven to two on Sunday; closed Monday. */
const MEX_TACO_HOURS: DayHours[] = [
  { open: "07:00", close: "14:00" },
  null,
  { open: "06:00", close: "14:00" },
  { open: "06:00", close: "14:00" },
  { open: "06:00", close: "14:00" },
  { open: "06:00", close: "14:00" },
  { open: "06:00", close: "14:00" },
];

export const EMPTY_DEAL: VenueDeal = { rentMonthly: 0, sharePercent: 0, dueDay: 1, note: "" };

function seed(): Venue {
  return {
    id: MEX_TACO_ID,
    name: "Mex Taco House",
    place: "Cypress, TX",
    address: "25410 B1 Northwest Fwy, Cypress, TX 77429",
    status: "live",
    screens: 1,
    slides: 18,
    sellable: 16,
    slideSeconds: 10,
    hours: MEX_TACO_HOURS,
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    deal: { ...EMPTY_DEAL },
    utmSource: MEX_TACO_ID,
    notes: "",
    builtIn: true,
    createdAt: "",
    updatedAt: "",
  };
}

export const DEFAULT_VENUE_ID = MEX_TACO_ID;

/* ---------------------------------- reads --------------------------------- */

const KEY = (id: string) => `ads:venue:${id}`;
const INDEX = "ads:venues";

function parse(raw: unknown): Venue | null {
  try {
    const v = raw ? (JSON.parse(String(raw)) as Partial<Venue>) : null;
    if (!v || !v.id || !v.name) return null;
    return normalise(v);
  } catch {
    return null;
  }
}

/** Fills in anything a record written by an older version left out. */
function normalise(v: Partial<Venue>): Venue {
  const base = v.id === MEX_TACO_ID ? seed() : blank();
  const hours = Array.isArray(v.hours) && v.hours.length === 7 ? v.hours : base.hours;
  return {
    ...base,
    ...v,
    id: v.id ?? base.id,
    name: v.name ?? base.name,
    hours,
    deal: { ...EMPTY_DEAL, ...(v.deal ?? {}) },
    utmSource: v.utmSource || slug(v.name ?? base.name),
    builtIn: v.id === MEX_TACO_ID ? true : undefined,
  };
}

function blank(): Venue {
  return {
    id: "",
    name: "",
    place: "",
    address: "",
    status: "pending",
    screens: 1,
    slides: 18,
    sellable: 16,
    slideSeconds: 10,
    hours: MEX_TACO_HOURS.map((h) => (h ? { ...h } : null)),
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    deal: { ...EMPTY_DEAL },
    utmSource: "",
    notes: "",
    createdAt: "",
    updatedAt: "",
  };
}

/** A fresh record for the add form, with sensible defaults copied from the rotation that exists. */
export function newVenueDefaults(): Venue {
  return blank();
}

export function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

/**
 * Every location, Mex Taco House first, then the rest in the order they were
 * added. Ended locations stay in the list so their history still reads.
 *
 * The share and owner that used to live in the old settings record are read
 * into the seed when no Mex Taco record has been saved yet, so nothing that
 * was already set up is lost on the way over.
 */
export async function listVenues(): Promise<Venue[]> {
  const [ids] = await redisPipeline([["SMEMBERS", INDEX]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  const stored = list.length
    ? (((await redisPipeline([["MGET", ...list.map(KEY)]]))[0] as unknown[]) ?? []).map(parse).filter((v): v is Venue => v !== null)
    : [];

  const byId = new Map(stored.map((v) => [v.id, v]));
  if (!byId.has(MEX_TACO_ID)) {
    const legacy = await getSettings();
    const first = seed();
    first.deal.sharePercent = legacy.venueSharePercent || 0;
    first.ownerName = legacy.venueOwnerName || "";
    first.ownerEmail = legacy.venueOwnerEmail || "";
    byId.set(MEX_TACO_ID, first);
  }

  return [...byId.values()].sort((a, b) => {
    if (a.id === MEX_TACO_ID) return -1;
    if (b.id === MEX_TACO_ID) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function getVenue(id: string): Promise<Venue | null> {
  const all = await listVenues();
  return all.find((v) => v.id === id) ?? null;
}

/**
 * The venue an id names, out of a list already loaded. Falls back to the
 * first, which is Mex Taco House, so a record written before locations
 * existed still belongs somewhere.
 */
export function venueOf(venues: Venue[], id?: string | null): Venue {
  return venues.find((v) => v.id === id) ?? venues[0] ?? seed();
}

/** Locations that can carry an ad today. */
export function liveVenues(venues: Venue[]): Venue[] {
  return venues.filter((v) => v.status === "live");
}

/** Whether the location switcher and location pickers are worth showing. */
export function hasSeveral(venues: Venue[]): boolean {
  return venues.filter((v) => v.status !== "ended").length > 1;
}

/* --------------------------------- writes --------------------------------- */

export type VenueInput = Omit<Venue, "id" | "builtIn" | "createdAt" | "updatedAt"> & { id?: string };

export function validateVenue(input: VenueInput): string | null {
  if (!input.name.trim()) return "Give the location a name.";
  if (!Number.isInteger(input.slides) || input.slides < 1 || input.slides > 60) return "How many slides are in the loop? A whole number, 1 to 60.";
  if (!Number.isInteger(input.sellable) || input.sellable < 0 || input.sellable > input.slides) return "Slides for sale can't be more than the slides in the loop.";
  if (!Number.isInteger(input.screens) || input.screens < 1) return "How many screens are in the room?";
  if (!Number.isInteger(input.slideSeconds) || input.slideSeconds < 3 || input.slideSeconds > 120) return "Seconds per slide: a whole number, 3 to 120.";
  if (input.hours.length !== 7) return "Give hours for all seven days, or mark a day closed.";
  for (const day of input.hours) {
    if (!day) continue;
    if (!/^\d{2}:\d{2}$/.test(day.open) || !/^\d{2}:\d{2}$/.test(day.close)) return "Hours need to be times, like 06:00.";
    if (day.close <= day.open) return "A day's closing time has to be after its opening time.";
  }
  if (!Number.isFinite(input.deal.rentMonthly) || input.deal.rentMonthly < 0) return "Rent has to be a dollar amount, or blank.";
  if (!Number.isFinite(input.deal.sharePercent) || input.deal.sharePercent < 0 || input.deal.sharePercent > 100) return "The share is a percentage, 0 to 100.";
  if (!Number.isInteger(input.deal.dueDay) || input.deal.dueDay < 1 || input.deal.dueDay > 28) return "The due day is a day of the month, 1 to 28, so it exists in February.";
  if (input.ownerEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.ownerEmail)) return "That owner email doesn't look like an address.";
  return null;
}

export async function saveVenue(input: VenueInput): Promise<{ ok: boolean; id: string; error?: string }> {
  const invalid = validateVenue(input);
  if (invalid) return { ok: false, id: input.id ?? "", error: invalid };

  const now = new Date().toISOString();
  const existing = input.id ? await getVenue(input.id) : null;
  const id = existing?.id ?? input.id ?? uniqueId(input.name, await listVenues());

  const record: Venue = normalise({
    ...(existing ?? {}),
    ...input,
    id,
    name: input.name.trim(),
    utmSource: (input.utmSource || existing?.utmSource || slug(input.name)).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });

  const ok = await redisWrite([
    ["SET", KEY(id), JSON.stringify(record)],
    ["SADD", INDEX, id],
  ]);
  return { ok, id };
}

function uniqueId(name: string, venues: Venue[]): string {
  const base = slug(name) || "location";
  const taken = new Set(venues.map((v) => v.id));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n += 1) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${Date.now()}`;
}

/**
 * Locations are never deleted. One with advertisers, payments and statements
 * behind it is history the books need; mark it ended instead.
 */
export async function setVenueStatus(id: string, status: VenueStatus): Promise<boolean> {
  const venue = await getVenue(id);
  if (!venue) return false;
  const result = await saveVenue({ ...venue, status });
  return result.ok;
}

/* -------------------------------- the rotation ---------------------------- */

/** How many times one slide plays in one open hour. */
export function playsPerHour(venue: Pick<Venue, "slides" | "slideSeconds">): number {
  const loop = Math.max(1, venue.slides * venue.slideSeconds);
  return 3600 / loop;
}

/** Hours the doors are open on a weekday, 0 = Sunday. */
export function hoursOpen(venue: Pick<Venue, "hours">, weekday: number): number {
  const day = venue.hours[weekday];
  if (!day) return 0;
  const [oh, om] = day.open.split(":").map(Number);
  const [ch, cm] = day.close.split(":").map(Number);
  return Math.max(0, (ch * 60 + cm - (oh * 60 + om)) / 60);
}

/**
 * Plays one slide gets on a given weekday. Mex Taco House: 8 hours at 20 an
 * hour is 160, Sunday 140, Monday closed. Whole numbers, because a report
 * says "played 160 times", not 159.7.
 */
export function playsOnWeekday(venue: Pick<Venue, "hours" | "slides" | "slideSeconds">, weekday: number): number {
  return Math.round(hoursOpen(venue, weekday) * playsPerHour(venue));
}

/** "Mon–Sat 6:00 AM–2:00 PM · Sun 7:00 AM–2:00 PM · Closed Monday", for a statement or an agreement. */
export function describeHours(venue: Pick<Venue, "hours">): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  };
  const groups: { label: string; days: string[] }[] = [];
  venue.hours.forEach((day, i) => {
    const label = day ? `${fmt(day.open)}–${fmt(day.close)}` : "Closed";
    const short = WEEKDAYS[i].slice(0, 3);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.days.push(short);
    else groups.push({ label, days: [short] });
  });
  return groups
    .map((g) => `${g.days.length > 2 ? `${g.days[0]}–${g.days[g.days.length - 1]}` : g.days.join(", ")} ${g.label === "Closed" ? "closed" : g.label}`)
    .join(" · ");
}

/* ------------------------------- what is owed ------------------------------ */

/**
 * What the venue is owed for a month: the fixed rent, plus its share of what
 * its advertisers actually paid. `collected` is the month's collections from
 * that location's advertisers only.
 */
export function owedForMonth(venue: Pick<Venue, "deal">, collected: number): { rent: number; share: number; total: number } {
  const rent = Math.round(venue.deal.rentMonthly * 100) / 100;
  const share = Math.round(collected * (venue.deal.sharePercent / 100) * 100) / 100;
  return { rent, share, total: Math.round((rent + share) * 100) / 100 };
}

/** True when this venue's deal costs anything at all. */
export function hasDeal(venue: Pick<Venue, "deal">): boolean {
  return venue.deal.rentMonthly > 0 || venue.deal.sharePercent > 0;
}
