/**
 * The free website check, from the form to the hot lead.
 *
 * Four things happen here: a visitor asks for a check, the worker reports
 * back on it, the visitor asks us to fix what it found, or a visitor with no
 * website asks for one. Each records a lead in the portal, and the last two
 * tell the team at once.
 *
 * The rules that shape it:
 *   - A bot or a flood gets an answer that looks like success and records
 *     nothing, the same way the advertise form behaves.
 *   - A scan that cannot run still becomes a lead. The visitor is told we
 *     will check by hand, and somebody is asked to.
 *   - Everything the worker reports is handled once, however many times a
 *     callback is retried or the status page asks.
 *   - Nothing in here throws at a public endpoint.
 */

import { ADMIN_LEAD_URL } from "./paths";
import { BEST_TIMES, NEEDS, NOTICE_TEXT, NO_WEBSITE_NOTICE_TEXT } from "./notice";
import { notifyTeam } from "@/lib/ads/notify";
import { couldNotScanEmail, noWebsiteEmail, reportEmail, reportLinks, reportUrl, sendToOwner } from "./email";
import { countLine, isLeadReport, siteName, topFindings, type LeadReport, type Rating } from "./report";
import {
  DAILY_CEILING,
  addEvent,
  advance,
  claimOnce,
  countScanToday,
  createLead,
  findLead,
  getLead,
  getReport,
  getScan,
  getWbSettings,
  hostOf,
  newReportId,
  newScanId,
  patchLead,
  recentReportFor,
  saveReport,
  saveScan,
  suppressEmail,
  withinIpLimit,
  type Lead,
  type ScanRecord,
} from "./store";
import { passedTurnstile } from "./turnstile";
import { askWorker, startScan, type WorkerEvent } from "./worker";


const SOURCES = ["nav", "homepage", "footer", "ada-blog", "postcard", "email"];

const clean = (value: unknown, max: number) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);

/** Where the visitor came from, cleaned the way a `/go/` code is. */
export function cleanCheckSource(raw: unknown): string {
  const value = String(raw ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  return SOURCES.includes(value) ? value : value ? "other" : "direct";
}

const isEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

/**
 * The address as typed, turned into something a scan can be pointed at, or
 * null when it is not a public website. The worker checks again, properly,
 * with a DNS lookup; this is the first, cheap refusal.
 */
export function normalizeWebsite(raw: string): string | null {
  const typed = raw.trim();
  if (!typed || /\s/.test(typed)) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(typed) ? typed : `https://${typed}`);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || host.endsWith(".")) return null;
  // No bare addresses, and nothing that only resolves inside a network.
  if (/^[\d.]+$/.test(host) || host.includes(":") || /\.(local|localhost|internal|test|example|invalid)$/.test(host)) return null;
  if (!/^[a-z0-9.-]+$/.test(host) || !/\.[a-z]{2,}$/.test(host)) return null;
  return `${url.protocol}//${host}`;
}

/* ------------------------------ start a check ------------------------------ */

export type CheckInput = {
  website: string;
  email: string;
  source: string;
  businessName: string;
  /** Hidden field. A person never fills it in. */
  honeypot: string;
  turnstileToken: string;
};

export function readCheckInput(body: Record<string, unknown>): CheckInput {
  return {
    website: clean(body.website, 300),
    email: clean(body.email, 160),
    source: cleanCheckSource(body.source),
    businessName: clean(body.businessName, 160),
    honeypot: clean(body.company_website, 200),
    turnstileToken: clean(body.turnstileToken, 2100),
  };
}

export type CheckResult =
  /** Go to the progress page. Bots and floods get an id that leads nowhere. */
  | { ok: true; scanId: string }
  | { ok: false; field: "website" | "email"; message: string };

const failureFor = (reason: string) =>
  ({
    unreachable: "The address is not a public website, or it does not resolve.",
    queue_full: "The scanner's queue was full.",
    worker_down: "The scanner could not be reached.",
    paused: "The scanner is paused.",
    ceiling: "The daily scan ceiling was reached.",
  })[reason] ?? reason;

/** Records a scan that did not run, tells the visitor's inbox and the team. */
async function failScan(lead: Lead, scan: ScanRecord, reason: string): Promise<void> {
  const failed: ScanRecord = { ...scan, state: "failed", failure: reason, updatedAt: new Date().toISOString() };
  await saveScan(failed);
  const saved = await patchLead(lead.id, () => ({ scan: { scanId: scan.scanId, state: "failed", failure: reason } }));
  const first = await addEvent(lead.id, "scan_failed", scan.scanId, failureFor(reason));
  if (!first) return;
  await sendToOwner(saved ?? lead, "could-not-scan", (footer) => couldNotScanEmail(scan.url, footer), scan.scanId);
  await notifyTeam({
    subject: `Scan failed: ${scan.host}`,
    lines: [failureFor(reason), lead.email ?? "", "The visitor was told we would check it by hand and write back."],
    href: ADMIN_LEAD_URL(lead.id),
    cta: "Open the lead",
  }).catch(() => {});
}

/** Stores a finished report against its lead and sends the report email. */
async function completeScan(lead: Lead, scan: ScanRecord, report: LeadReport): Promise<void> {
  const reportId = scan.reportId ?? newReportId();
  await saveReport({ reportId, leadId: lead.id, scanId: scan.scanId, createdAt: new Date().toISOString(), report }, scan.host);
  await saveScan({ ...scan, state: "completed", reportId, step: "report", stepIndex: scan.stepCount ?? scan.stepIndex, updatedAt: new Date().toISOString() });
  const saved = await patchLead(lead.id, (l) => ({
    status: advance(l.status, "scanned"),
    scan: { scanId: scan.scanId, reportId, state: "completed", problems: report.totals.problems, serious: report.totals.serious },
  }));
  await addEvent(lead.id, "scan_completed", scan.scanId, countLine(report.totals));
  const current = saved ?? lead;
  await sendToOwner(current, "report", (footer) => reportEmail(report, reportLinks(current, reportId), footer), scan.scanId);
}

export async function startCheck(input: CheckInput, ip: string): Promise<CheckResult> {
  // A bot gets a success it can learn nothing from.
  if (input.honeypot) return { ok: true, scanId: newScanId() };

  const url = normalizeWebsite(input.website);
  if (!url) return { ok: false, field: "website", message: "Enter your website address, like yourbusiness.com." };
  if (!isEmail(input.email)) return { ok: false, field: "email", message: "Enter the email address to send your report to." };

  try {
    if (!(await passedTurnstile(input.turnstileToken, ip))) return { ok: true, scanId: newScanId() };
    if (!(await withinIpLimit(ip))) return { ok: true, scanId: newScanId() };

    const host = hostOf(url);
    const now = new Date().toISOString();
    const existing = await findLead(input.email, host);
    const lead =
      existing ??
      (await createLead({
        status: "visited",
        source: input.source,
        website: url,
        email: input.email,
        businessName: input.businessName || undefined,
        notice: { text: NOTICE_TEXT, at: now },
      }));
    // The database is away. The visitor still gets an answer, by hand.
    if (!lead) return { ok: true, scanId: newScanId() };

    const scanId = newScanId();
    const scan: ScanRecord = { scanId, leadId: lead.id, url, host, state: "running", step: "load", stepIndex: 1, stepCount: 5, createdAt: now, updatedAt: now, workerAt: now };
    await saveScan(scan);
    await patchLead(lead.id, () => ({ scan: { scanId, state: "running" } }));
    await addEvent(lead.id, "scan_started", scanId, host);

    // A site scanned in the last 24 hours gets the saved report, as its own
    // copy, so this lead's report page and fix button belong to this lead.
    const recent = await recentReportFor(host);
    if (recent) {
      await completeScan(lead, scan, recent.report);
      return { ok: true, scanId };
    }

    const settings = await getWbSettings();
    if (settings.scannerPaused) {
      await failScan(lead, scan, "paused");
      return { ok: true, scanId };
    }
    const today = await countScanToday();
    if (today > DAILY_CEILING) {
      await failScan(lead, scan, "ceiling");
      if (await claimOnce(`ceiling:${now.slice(0, 10)}`, 2 * 24 * 60 * 60)) {
        await notifyTeam({
          subject: "The website check paused itself for today",
          lines: [`More than ${DAILY_CEILING} scans were asked for today.`, "New visitors are told we will check by hand. It starts again tomorrow."],
          href: ADMIN_LEAD_URL(),
          cta: "Open Website Business",
        }).catch(() => {});
      }
      return { ok: true, scanId };
    }

    const started = await startScan({ scanId, url, label: input.businessName || undefined });
    if (!started.ok) await failScan(lead, scan, started.reason);
    return { ok: true, scanId };
  } catch {
    return { ok: true, scanId: newScanId() };
  }
}

/* --------------------------- the worker reports back ----------------------- */

/**
 * Applies one state from the worker to a scan. Called by the callback
 * endpoint and by the status page's fallback, so it has to be safe to call
 * any number of times with the same news.
 */
export async function applyWorkerEvent(event: WorkerEvent): Promise<void> {
  const scan = await getScan(event.scanId);
  if (!scan || scan.state !== "running") return;
  const now = new Date().toISOString();

  if (event.event === "started" || event.event === "progress") {
    // Progress only moves forward; a late callback never rewinds the screen.
    if ((event.stepIndex ?? 0) >= (scan.stepIndex ?? 0)) {
      await saveScan({ ...scan, step: event.step ?? scan.step, stepIndex: event.stepIndex ?? scan.stepIndex, stepCount: event.stepCount ?? scan.stepCount, updatedAt: now, workerAt: now });
    }
    return;
  }

  if (!(await claimOnce(`scan:${scan.scanId}:${event.event}`))) return;
  const lead = await getLead(scan.leadId);
  if (!lead) return;

  if (event.event === "completed" && isLeadReport(event.report)) {
    await completeScan(lead, { ...scan, stepCount: event.stepCount ?? scan.stepCount, workerAt: now }, event.report);
    return;
  }
  await failScan(lead, { ...scan, workerAt: now }, event.failure?.reason ?? "unreachable");
}

/** How long a scan may be silent before the status page asks the worker itself. */
const SILENCE_MS = 6_000;
/** A scan with no news for this long is not coming back. */
const GIVE_UP_MS = 5 * 60_000;

export type CheckStatus =
  | { state: "running"; step: string; stepIndex: number; stepCount: number }
  | {
      state: "completed";
      reportId: string;
      site: string;
      totals: { problems: number; serious: number };
      sections: { title: string; rating: Rating }[];
      top: { title: string; plain: string }[];
    }
  | { state: "failed" };

/**
 * What the progress page shows. An id this site has never seen answers
 * "failed", which reads as "we'll check it by hand": the same thing a bot or
 * a flooded address is shown, and nothing they can learn from.
 *
 * The spec has this ask the worker after 30 seconds of silence. It asks after
 * six, because a preview deployment never receives callbacks (the worker only
 * calls smartscaleagent.com) and would otherwise sit on the first step.
 */
export async function checkStatus(scanId: string): Promise<CheckStatus> {
  let scan = await getScan(scanId);
  if (!scan) return { state: "failed" };

  if (scan.state === "running" && Date.now() - Date.parse(scan.workerAt) > SILENCE_MS) {
    const news = await askWorker(scanId);
    if (news) {
      await applyWorkerEvent(news);
    } else if (Date.now() - Date.parse(scan.createdAt) > GIVE_UP_MS) {
      await applyWorkerEvent({ scanId, event: "failed", failure: { reason: "timeout" } });
    } else {
      await saveScan({ ...scan, workerAt: new Date().toISOString() });
    }
    scan = (await getScan(scanId)) ?? scan;
  }

  if (scan.state === "failed") return { state: "failed" };
  if (scan.state === "completed" && scan.reportId) {
    const stored = await getReport(scan.reportId);
    // Past its 90 days, or the database is away: by hand, like any other miss.
    if (!stored) return { state: "failed" };
    const { report } = stored;
    return {
      state: "completed",
      reportId: scan.reportId,
      site: siteName(report),
      totals: report.totals,
      sections: report.sections.map((s) => ({ title: s.title, rating: s.rating })),
      top: report.totals.problems === 0 ? [] : topFindings(report).map((f) => ({ title: f.title, plain: f.plain })),
    };
  }
  return { state: "running", step: scan.step ?? "load", stepIndex: scan.stepIndex ?? 1, stepCount: scan.stepCount ?? 5 };
}

/* ------------------------------- fix requests ------------------------------ */

/**
 * "Fix my website for me." Only ever called from a button press: on the
 * summary, on the report, or on the confirmation page an email link opens.
 * A link by itself never gets here, because mail scanners open links.
 */
export async function requestFix(leadId: string, from: "summary" | "report" | "email"): Promise<boolean> {
  const lead = await getLead(leadId);
  if (!lead) return false;
  const first = await addEvent(lead.id, "fix_requested", "fix", `From the ${from}`);
  if (!first) return true;
  await patchLead(lead.id, (l) => ({ status: advance(l.status, "hot"), hotReason: l.hotReason ?? "fix_requested" }));
  const site = lead.website ? siteName({ base: lead.website }) : "their site";
  await notifyTeam({
    subject: `Hot lead: fix requested for ${lead.businessName || site}`,
    lines: [
      [lead.businessName, site].filter(Boolean).join(" · "),
      lead.email ?? "",
      lead.scan?.state === "completed" ? countLine({ problems: lead.scan.problems ?? 0, serious: lead.scan.serious ?? 0 }) : "",
      lead.scan?.reportId ? `Report: ${reportUrl(lead.scan.reportId)}` : "",
      "They were told we would call within one business day.",
    ],
    href: ADMIN_LEAD_URL(lead.id),
    cta: "Open the lead",
  }).catch(() => {});
  return true;
}

/* --------------------------------- no website ------------------------------ */


export type NoWebsiteInput = {
  name: string;
  phone: string;
  email: string;
  businessName: string;
  needs: string[];
  bestTime: string;
  source: string;
  honeypot: string;
  turnstileToken: string;
};

export function readNoWebsiteInput(body: Record<string, unknown>): NoWebsiteInput {
  const needs = Array.isArray(body.needs) ? body.needs.map((n) => clean(n, 40)).filter((n) => (NEEDS as readonly string[]).includes(n)) : [];
  const bestTime = clean(body.bestTime, 20);
  return {
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    businessName: clean(body.businessName, 160),
    needs,
    bestTime: (BEST_TIMES as readonly string[]).includes(bestTime) ? bestTime : "",
    source: cleanCheckSource(body.source),
    honeypot: clean(body.company_website, 200),
    turnstileToken: clean(body.turnstileToken, 2100),
  };
}

export type NoWebsiteResult = { ok: true } | { ok: false; field: "name" | "phone" | "email"; message: string };

export async function recordNoWebsite(input: NoWebsiteInput, ip: string): Promise<NoWebsiteResult> {
  if (input.honeypot) return { ok: true };
  if (!input.name) return { ok: false, field: "name", message: "Enter your name." };
  if (input.phone.replace(/\D/g, "").length < 10) return { ok: false, field: "phone", message: "Enter a phone number with its area code." };
  if (!isEmail(input.email)) return { ok: false, field: "email", message: "Enter your email address." };

  try {
    if (!(await passedTurnstile(input.turnstileToken, ip))) return { ok: true };
    if (!(await withinIpLimit(ip))) return { ok: true };

    const lead = await createLead({
      status: "hot",
      hotReason: "no_website",
      source: input.source,
      contactName: input.name,
      phone: input.phone,
      email: input.email,
      businessName: input.businessName || undefined,
      needs: input.needs,
      bestTime: input.bestTime || undefined,
      notice: { text: NO_WEBSITE_NOTICE_TEXT, at: new Date().toISOString() },
    });
    if (!lead) return { ok: true };

    await addEvent(lead.id, "no_website_interested", "form", input.needs.join(", "));
    await notifyTeam({
      subject: `Hot lead: no website yet, ${input.businessName || input.name}`,
      lines: [
        [input.name, input.phone, input.email].filter(Boolean).join(" · "),
        input.needs.length ? `Needs: ${input.needs.join(", ")}` : "Did not say what they need",
        input.bestTime ? `Best time: ${input.bestTime}` : "",
        "They were told we would call within one business day.",
      ],
      href: ADMIN_LEAD_URL(lead.id),
      cta: "Open the lead",
    }).catch(() => {});
    await sendToOwner(lead, "no-website", (footer) => noWebsiteEmail(input.name, footer));
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/* -------------------------------- unsubscribe ------------------------------ */

/** Takes effect at once and is permanent. Safe to call twice. */
export async function unsubscribeLead(leadId: string): Promise<boolean> {
  const lead = await getLead(leadId);
  if (!lead?.email) return false;
  await suppressEmail(lead.email, "Unsubscribed from a website check email");
  if (!lead.emailOptOut) await patchLead(lead.id, () => ({ emailOptOut: new Date().toISOString() }));
  await addEvent(lead.id, "email_unsubscribed", "unsubscribe");
  return true;
}
