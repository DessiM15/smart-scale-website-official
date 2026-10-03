/**
 * The Website Business store: leads from the free website check, their
 * timelines, the scans behind them and the saved reports.
 *
 * Same database and the same habits as the ad business next door: plain
 * Upstash commands, reads that degrade to empty, writes that report failure.
 * Every key starts with `wb:` so the nightly backup can take the lot.
 *
 *   wb:leads                 set of lead ids
 *   wb:lead:{id}             one lead
 *   wb:lead:{id}:events      its timeline, newest first
 *   wb:scan:{scanId}         one scan's state, kept 90 days
 *   wb:report:{reportId}     the report a visitor is shown, kept 90 days
 *   wb:host:{host}           the report a site got in the last 24 hours
 *   wb:settings              the few values Dessi or Jay change by hand
 *   wb:suppress:email        addresses that asked not to be written to
 */

import { randomBytes, randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "@/lib/ads/redis";
import type { LeadReport } from "./report";

const DAY = 24 * 60 * 60;
/** Report links live 90 days. */
export const REPORT_TTL_SECONDS = 90 * DAY;
const EVENT_KEY_TTL_SECONDS = 400 * DAY;

/* ---------------------------------- leads --------------------------------- */

export const LEAD_STATUSES = ["mailed", "visited", "scanned", "hot", "contacted", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadScan = {
  scanId: string;
  reportId?: string;
  state: "running" | "completed" | "failed";
  problems?: number;
  serious?: number;
  failure?: string;
};

export type Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: LeadStatus;
  hotReason?: "fix_requested" | "no_website";
  /** nav, homepage, footer, ada-blog, postcard, email, or direct. */
  source: string;
  code?: string;
  prospectId?: string;
  businessName?: string;
  website?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  needs?: string[];
  bestTime?: string;
  scan?: LeadScan;
  /** The exact notice line shown when they submitted. */
  notice: { text: string; at: string };
  emailOptOut?: string;
  mailOptOut?: string;
  notes: { at: string; by: string; text: string }[];
};

const LEADS_INDEX = "wb:leads";
const leadKey = (id: string) => `wb:lead:${id}`;
const eventsKey = (id: string) => `wb:lead:${id}:events`;

function parse<T>(raw: unknown): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return null;
  }
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(id)) return null;
  const [raw] = await redisPipeline([["GET", leadKey(id)]]);
  return parse<Lead>(raw);
}

/** Every lead, newest first. The volume is small enough to read whole. */
export async function listLeads(): Promise<Lead[]> {
  const [ids] = await redisPipeline([["SMEMBERS", LEADS_INDEX]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list.map(leadKey)]]);
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => parse<Lead>(v))
    .filter((l): l is Lead => l !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt" | "notes">): Promise<Lead | null> {
  const now = new Date().toISOString();
  const lead: Lead = { ...input, id: `l_${randomUUID().replace(/-/g, "").slice(0, 16)}`, createdAt: now, updatedAt: now, notes: [] };
  const ok = await redisWrite([
    ["SET", leadKey(lead.id), JSON.stringify(lead)],
    ["SADD", LEADS_INDEX, lead.id],
  ]);
  return ok ? lead : null;
}

/** The order a lead moves through on its own. Contacted, Won and Lost are set by hand. */
const AUTO_ORDER: LeadStatus[] = ["mailed", "visited", "scanned", "hot"];

/**
 * Status only moves forward automatically. A lead already marked Contacted,
 * Won or Lost is never pulled back by something the visitor does later.
 */
export function advance(current: LeadStatus, to: LeadStatus): LeadStatus {
  const from = AUTO_ORDER.indexOf(current);
  const next = AUTO_ORDER.indexOf(to);
  if (from === -1 || next === -1) return current;
  return next > from ? to : current;
}

/** Merges a change into a lead. Returns the saved lead, or null when it did not save. */
export async function patchLead(id: string, change: (lead: Lead) => Partial<Lead>): Promise<Lead | null> {
  const lead = await getLead(id);
  if (!lead) return null;
  const next: Lead = { ...lead, ...change(lead), id: lead.id, createdAt: lead.createdAt, updatedAt: new Date().toISOString() };
  const ok = await redisWrite([["SET", leadKey(id), JSON.stringify(next)]]);
  return ok ? next : null;
}

/** The same person checking the same site again is the same lead. */
export async function findLead(email: string, host: string): Promise<Lead | null> {
  const wanted = email.toLowerCase();
  const leads = await listLeads();
  return leads.find((l) => l.email?.toLowerCase() === wanted && hostOf(l.website ?? "") === host) ?? null;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/* --------------------------------- events --------------------------------- */

export const EVENT_TYPES = [
  "mailed",
  "delivered",
  "returned",
  "visited",
  "scan_started",
  "scan_completed",
  "scan_failed",
  "fix_requested",
  "no_website_interested",
  "email_sent",
  "email_held",
  "email_unsubscribed",
  "mail_opted_out",
  "contacted",
  "won",
  "lost",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type LeadEvent = { type: EventType; at: string; detail?: string; by?: string };

/**
 * Appends to a lead's timeline, once per key. A retried callback or a double
 * click claims the same key and records nothing the second time.
 * Returns true when this call was the one that recorded it.
 */
export async function addEvent(leadId: string, type: EventType, key: string, detail?: string, by?: string): Promise<boolean> {
  const claim = `wb:evt:${leadId}:${type}:${key}`;
  const [claimed] = await redisPipeline([["SET", claim, "1", "NX", "EX", EVENT_KEY_TTL_SECONDS]]);
  if (claimed !== "OK") return false;
  const event: LeadEvent = { type, at: new Date().toISOString(), ...(detail ? { detail: detail.slice(0, 300) } : {}), ...(by ? { by } : {}) };
  await redisWrite([["LPUSH", eventsKey(leadId), JSON.stringify(event)]]);
  return true;
}

export async function listEvents(leadId: string): Promise<LeadEvent[]> {
  const [raw] = await redisPipeline([["LRANGE", eventsKey(leadId), 0, 199]]);
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => parse<LeadEvent>(r)).filter((e): e is LeadEvent => e !== null);
}

/**
 * Claims a one-time job (send this email, handle this callback). True for the
 * first caller only, so two requests racing on the same scan do the work once.
 */
export async function claimOnce(name: string, ttlSeconds = REPORT_TTL_SECONDS): Promise<boolean> {
  const [claimed] = await redisPipeline([["SET", `wb:once:${name}`, "1", "NX", "EX", ttlSeconds]]);
  return claimed === "OK";
}

/** Gives a claim back, so a job that failed can be tried again. */
export async function releaseOnce(name: string): Promise<void> {
  await redisWrite([["DEL", `wb:once:${name}`]]);
}

/* ---------------------------------- scans --------------------------------- */

export type ScanRecord = {
  scanId: string;
  leadId: string;
  url: string;
  host: string;
  state: "running" | "completed" | "failed";
  step?: string;
  stepIndex?: number;
  stepCount?: number;
  reportId?: string;
  failure?: string;
  createdAt: string;
  updatedAt: string;
  /** When the worker was last heard from or asked. Drives the status fallback. */
  workerAt: string;
};

const scanKey = (scanId: string) => `wb:scan:${scanId}`;

export const newScanId = () => `s_${randomBytes(12).toString("base64url")}`;
export const newReportId = () => `r_${randomBytes(16).toString("base64url")}`;
export const isId = (value: string) => /^[A-Za-z0-9_-]{6,64}$/.test(value);

export async function getScan(scanId: string): Promise<ScanRecord | null> {
  if (!isId(scanId)) return null;
  const [raw] = await redisPipeline([["GET", scanKey(scanId)]]);
  return parse<ScanRecord>(raw);
}

export async function saveScan(scan: ScanRecord): Promise<boolean> {
  return redisWrite([["SET", scanKey(scan.scanId), JSON.stringify(scan), "EX", REPORT_TTL_SECONDS]]);
}

/* --------------------------------- reports -------------------------------- */

export type StoredReport = { reportId: string; leadId: string; scanId: string; createdAt: string; report: LeadReport };

const reportKey = (reportId: string) => `wb:report:${reportId}`;
const hostKey = (host: string) => `wb:host:${host}`;

export async function getReport(reportId: string): Promise<StoredReport | null> {
  if (!isId(reportId)) return null;
  const [raw] = await redisPipeline([["GET", reportKey(reportId)]]);
  return parse<StoredReport>(raw);
}

export async function saveReport(stored: StoredReport, host: string): Promise<boolean> {
  return redisWrite([
    ["SET", reportKey(stored.reportId), JSON.stringify(stored), "EX", REPORT_TTL_SECONDS],
    // A site scanned in the last 24 hours gets the saved report, not a new scan.
    ["SET", hostKey(host), stored.reportId, "EX", DAY],
  ]);
}

/** The report this site got in the last 24 hours, if any. */
export async function recentReportFor(host: string): Promise<StoredReport | null> {
  const [reportId] = await redisPipeline([["GET", hostKey(host)]]);
  return reportId ? getReport(String(reportId)) : null;
}

/* ---------------------------------- limits -------------------------------- */

const IP_LIMIT = 5;
const IP_WINDOW_SECONDS = 60 * 60;
/** Scans a day across everyone before the scanner pauses itself. */
export const DAILY_CEILING = 150;

/** True while this address is under its hourly allowance. Fails open. */
export async function withinIpLimit(ip: string): Promise<boolean> {
  if (!ip) return true;
  const key = `wb:rate:ip:${ip}`;
  const [count] = await redisPipeline([
    ["INCR", key],
    ["EXPIRE", key, IP_WINDOW_SECONDS],
  ]);
  if (count === undefined || count === null) return true;
  return Number(count) <= IP_LIMIT;
}

/** Counts one scan against today. Returns today's total, or 0 when the database is away. */
export async function countScanToday(): Promise<number> {
  const key = `wb:rate:day:${new Date().toISOString().slice(0, 10)}`;
  const [count] = await redisPipeline([
    ["INCR", key],
    ["EXPIRE", key, 2 * DAY],
  ]);
  return Number(count ?? 0) || 0;
}

/* --------------------------------- settings ------------------------------- */

export type WbSettings = {
  /** Printed at the foot of every email to a business owner. Required by law. */
  postalAddress: string;
  /** Stops new scans from the public page. Leads are still recorded. */
  scannerPaused: boolean;
  updatedAt: string;
};

const SETTINGS_KEY = "wb:settings";
const DEFAULT_SETTINGS: WbSettings = { postalAddress: "", scannerPaused: false, updatedAt: "" };

export async function getWbSettings(): Promise<WbSettings> {
  const [raw] = await redisPipeline([["GET", SETTINGS_KEY]]);
  return { ...DEFAULT_SETTINGS, ...(parse<Partial<WbSettings>>(raw) ?? {}) };
}

export async function saveWbSettings(input: Omit<WbSettings, "updatedAt">): Promise<boolean> {
  return redisWrite([["SET", SETTINGS_KEY, JSON.stringify({ ...input, updatedAt: new Date().toISOString() })]]);
}

/* ------------------------------- do not email ------------------------------ */

const SUPPRESS_EMAIL = "wb:suppress:email";

export type Suppression = { email: string; at: string; reason: string };

export async function suppressEmail(email: string, reason: string): Promise<boolean> {
  const address = email.trim().toLowerCase();
  if (!address) return false;
  return redisWrite([["HSET", SUPPRESS_EMAIL, address, JSON.stringify({ at: new Date().toISOString(), reason })]]);
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const [hit] = await redisPipeline([["HGET", SUPPRESS_EMAIL, email.trim().toLowerCase()]]);
  return Boolean(hit);
}

export async function listSuppressedEmails(): Promise<Suppression[]> {
  const [raw] = await redisPipeline([["HGETALL", SUPPRESS_EMAIL]]);
  if (!Array.isArray(raw)) return [];
  const out: Suppression[] = [];
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const entry = parse<{ at: string; reason: string }>(raw[i + 1]);
    out.push({ email: String(raw[i]), at: entry?.at ?? "", reason: entry?.reason ?? "" });
  }
  return out;
}

/* ---------------------------------- backup -------------------------------- */

/** Everything under `wb:` that could not be rebuilt, for the nightly backup. */
export async function exportWebsiteBusiness() {
  const leads = await listLeads();
  const [settings, suppressedEmails, timelines] = await Promise.all([
    getWbSettings(),
    listSuppressedEmails(),
    Promise.all(leads.map((l) => listEvents(l.id))),
  ]);
  return {
    leads: leads.map((lead, i) => ({ ...lead, events: timelines[i] })),
    settings,
    suppressedEmails,
  };
}
