/**
 * Leads from the advertise page, landing straight in the interested list.
 *
 * The form has always posted to Web3Forms, which puts a copy in an inbox and
 * nothing anywhere else — so every lead had to be read and retyped into the
 * tracker by hand, and the ones that weren't simply vanished. This records them
 * as they arrive.
 *
 * Web3Forms stays exactly as it is. It is the delivery guarantee: if anything
 * here fails, the email still lands and the person who filled in the form still
 * sees a thank-you. Nothing in this file is allowed to make a submission look
 * broken to a business trying to give us money.
 */

import { redisPipeline } from "./redis";
import {
  categoryConflict,
  listAdvertisers,
  listProspects,
  saveProspect,
  type Prospect,
} from "./roster";
import { sendTeamSms } from "./notify";

/** Per-IP submissions allowed in a rolling hour. Generous; this is anti-flood. */
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 60 * 60;

export type LeadInput = {
  name: string;
  business: string;
  email: string;
  phone: string;
  packageInterest: string;
  industry: string;
  hasCreative: string;
  hasLogos: string;
  message: string;
  /** The band they picked on the form, or blank if they skipped it. */
  budget: string;
  /** Which flyer or drop sent them, from ?src= on the page they filled in. */
  campaign: string;
  /** Hidden field. A human never fills this in; a bot fills in everything. */
  honeypot: string;
};

export type LeadResult = {
  ok: boolean;
  /** Accepted but deliberately not stored — spam, or over the hourly allowance. */
  skipped?: string;
  error?: string;
};

/** Trims, caps the length, and flattens control characters out of free text. */
const clean = (value: unknown, max: number) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);

export function readLead(form: {
  get(name: string): FormDataEntryValue | null;
}): LeadInput {
  return {
    name: clean(form.get("name"), 120),
    business: clean(form.get("business_name"), 160),
    email: clean(form.get("email"), 160),
    phone: clean(form.get("phone"), 40),
    packageInterest: clean(form.get("package_interest"), 80),
    industry: clean(form.get("industry"), 120),
    hasCreative: clean(form.get("has_creative"), 40),
    hasLogos: clean(form.get("has_logos"), 40),
    message: clean(form.get("message"), 1200),
    budget: clean(form.get("budget"), 60),
    campaign: clean(form.get("src"), 40),
    honeypot: clean(form.get("company_website"), 200),
  };
}

/**
 * Only enough to tell a real submission from a bot. The form does its own
 * required-field checking; duplicating it here would mean enforcing a stricter
 * rule than the one the visitor was shown, and losing a lead to it.
 */
export function validateLead(lead: LeadInput): string | null {
  if (lead.honeypot) return "honeypot";
  if (!lead.business && !lead.name) return "empty";
  if (lead.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) return "email";
  return null;
}

/** True while this address is under its hourly allowance. Fails open. */
async function withinRateLimit(ip: string): Promise<boolean> {
  if (!ip) return true;
  const key = `ads:lead:rate:${ip}`;
  const [count] = await redisPipeline([
    ["INCR", key],
    ["EXPIRE", key, RATE_WINDOW_SECONDS],
  ]);
  // An unreachable database returns [] — never a reason to refuse a lead.
  if (count === undefined || count === null) return true;
  return Number(count) <= RATE_LIMIT;
}

/** The same business coming back isn't a new lead; it's the same one, warmer. */
function matchExisting(
  prospects: Prospect[],
  lead: LeadInput,
): Prospect | undefined {
  const email = lead.email.toLowerCase();
  const business = lead.business.toLowerCase();
  return prospects.find(
    (p) =>
      (email && p.email.toLowerCase() === email) ||
      (business && p.business.toLowerCase() === business),
  );
}

function noteFor(lead: LeadInput, stampedAt: string): string {
  const parts = [
    lead.budget && `Budget: ${lead.budget}`,
    lead.packageInterest && `Wants: ${lead.packageInterest}`,
    lead.campaign && `Came from: ${lead.campaign}`,
    lead.hasCreative && `Creative: ${lead.hasCreative}`,
    lead.hasLogos && `Logos: ${lead.hasLogos}`,
    lead.message && `"${lead.message}"`,
  ].filter(Boolean);
  return `${stampedAt}, from the advertise page. ${parts.join(" · ")}`.trim();
}

/**
 * Records the lead and texts whoever is on the alert list. Never throws — the
 * caller is a public endpoint whose first duty is not breaking the form.
 */
export async function recordLead(
  lead: LeadInput,
  ip: string,
): Promise<LeadResult> {
  const invalid = validateLead(lead);
  // A bot gets a success it can learn nothing from.
  if (invalid === "honeypot") return { ok: true, skipped: "honeypot" };
  if (invalid) return { ok: false, error: invalid };

  try {
    if (!(await withinRateLimit(ip))) return { ok: true, skipped: "rate" };

    const [prospects, advertisers] = await Promise.all([
      listProspects(),
      listAdvertisers(),
    ]);

    const existing = matchExisting(prospects, lead);
    const stampedAt = new Date().toISOString().slice(0, 10);
    const note = noteFor(lead, stampedAt);

    const { ok } = await saveProspect(
      {
        business: lead.business || lead.name,
        contactName: lead.name,
        email: lead.email,
        phone: lead.phone,
        category: lead.industry || existing?.category || "",
        source: "Advertise page",
        // Kept even when this submission didn't carry one, so a client who
        // first arrived through a flyer keeps that attribution on a repeat.
        campaign: lead.campaign || existing?.campaign,
        budget: lead.budget || existing?.budget,
        // Never downgrade one you've already worked — a prospect you marked
        // hot is still hot when they fill the form in a second time. Somebody
        // you'd passed on coming back is the exception: that is news, and it
        // should reappear in the queue.
        status: !existing || existing.status === "passed" ? "new" : existing.status,
        notes: existing?.notes ? `${existing.notes}\n${note}` : note,
      },
      existing?.id,
    );

    if (!ok) return { ok: false, error: "save" };

    // Whether their category is free is the first thing you'd want to know
    // before calling back, so it goes in the text rather than making you look
    // it up.
    const clash = lead.industry
      ? categoryConflict(advertisers, lead.industry)
      : undefined;
    const category = lead.industry
      ? clash
        ? `${lead.industry} TAKEN by ${clash.business}`
        : `${lead.industry} is OPEN`
      : "no category given";

    await sendTeamSms(
      `Mex Taco ads · NEW LEAD${existing ? " (repeat)" : ""}: ${
        lead.business || lead.name
      }. ${category}. ${lead.phone || lead.email}. Budget ${
        lead.budget || "not given"
      }${lead.campaign ? `. From ${lead.campaign}` : ""}. smartscaleagent.com/advertise/admin?tab=prospects`,
    );

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "lead failed",
    };
  }
}
