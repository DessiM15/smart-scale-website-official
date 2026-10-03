/**
 * Email to the people who used the website check.
 *
 * Sent with the same `sendEmail` as everything else, in the same cream, ink
 * and red. What is different here is who it goes to: business owners who are
 * not clients. So every message says who it is from and why it arrived,
 * carries an unsubscribe link and the postal address, and says a check is
 * not a legal certification.
 *
 * One rule is enforced in `sendToOwner` and nowhere else: until the postal
 * address is set in the portal, nothing goes to anyone outside the team's
 * own addresses. The message is held and the lead's timeline says so.
 */

import { BOOKING_URL, BUSINESS, SITE_URL } from "@/lib/business";
import { isEmailConfigured, sendEmail } from "@/lib/ads/email";
import { alertRecipients } from "@/lib/ads/notify";
import { fixUrl, oneClickUnsubscribeUrl, unsubscribeUrl } from "./links";
import { CLEAN_NOTE, NOT_LEGAL_LINE, RATING_LABEL, countLine, siteName, topFindings, type LeadReport } from "./report";
import { addEvent, claimOnce, getWbSettings, isEmailSuppressed, releaseOnce, type Lead } from "./store";

const INK = "#1a1210";
const MUTED = "#6b5d52";
const RED = "#DC2626";
const CREAM = "#faf6f0";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function button(href: string, label: string, primary: boolean): string {
  const bg = primary ? RED : "#ffffff";
  const color = primary ? "#ffffff" : INK;
  const border = primary ? RED : "rgba(0,0,0,0.12)";
  return `<a href="${href}" style="display:inline-block;background:${bg};color:${color};border:1px solid ${border};border-radius:10px;padding:12px 22px;font-weight:600;font-size:15px;text-decoration:none;margin:0 8px 10px 0;">${label}</a>`;
}

type Message = { subject: string; html: string; text: string };

/** What every message to an owner ends with. */
type Footer = { why: string; unsubscribe: string | null; postalAddress: string };

function frame(eyebrow: string, heading: string, body: string, footer: Footer): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:${FONT};color:${INK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;"><tr>
    <td style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${RED};font-weight:700;">${eyebrow}</td>
    <td align="right" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};font-weight:700;">Smart Scale</td>
  </tr></table>
  <h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;font-weight:600;">${heading}</h1>
  ${body}
  <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">
    ${esc(footer.why)} ${NOT_LEGAL_LINE}
  </p>
  <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">
    Smart Scale, ${esc(footer.postalAddress || `${BUSINESS.locality}, ${BUSINESS.region}`)}.${
      footer.unsubscribe ? ` <a href="${footer.unsubscribe}" style="color:${MUTED};">Unsubscribe</a>` : ""
    }
  </p>
</div>
</body></html>`;
}

function textFooter(footer: Footer): string {
  return `${footer.why} ${NOT_LEGAL_LINE}

Smart Scale, ${footer.postalAddress || `${BUSINESS.locality}, ${BUSINESS.region}`}.${footer.unsubscribe ? `\nUnsubscribe: ${footer.unsubscribe}` : ""}`;
}

const card = (inner: string) =>
  `<div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:20px 24px;margin-bottom:18px;">${inner}</div>`;

/* --------------------------------- report --------------------------------- */

export function reportEmail(report: LeadReport, links: { report: string; fix: string | null }, footer: Footer): Message {
  const site = siteName(report);
  const clean = report.totals.problems === 0;
  const line = countLine(report.totals);
  const top = topFindings(report);
  const subject = clean ? `Your website check for ${site}: no problems found` : `Your website check for ${site}: ${line.toLowerCase()}`;

  const ratings = report.sections
    .map(
      (s) =>
        `<tr><td style="padding:6px 0;font-size:15px;">${esc(s.title)}</td><td align="right" style="padding:6px 0;font-size:15px;font-weight:600;">${RATING_LABEL[s.rating]}</td></tr>`,
    )
    .join("");

  const body = `
  <p style="margin:0 0 18px;font-size:15px;line-height:1.65;">
    We checked ${esc(site)} the way a visitor and Google would: on a computer, on a phone, with a keyboard, and against the basics Google looks for.
  </p>
  ${card(`<table width="100%" cellpadding="0" cellspacing="0">${ratings}</table>`)}
  ${
    clean
      ? card(`<p style="margin:0;font-size:15px;line-height:1.65;">${CLEAN_NOTE} If you would like a person to look at how your business shows up on Google, we are happy to do that on a short call.</p>`)
      : card(
          `<p style="margin:0 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${RED};font-weight:700;">What matters most</p>` +
            top
              .map(
                (f) =>
                  `<p style="margin:0 0 4px;font-size:15px;line-height:1.5;font-weight:600;">${esc(f.title)}</p><p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:${MUTED};">${esc(f.plain)}</p>`,
              )
              .join(""),
        )
  }
  <div style="margin-bottom:8px;">
    ${clean ? button(BOOKING_URL, "Book a free call", true) : links.fix ? button(links.fix, "Fix my website for me", true) : ""}
    ${button(links.report, "See the full report", clean || !links.fix)}
  </div>
  <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
    The report link works for 90 days. Reply to this email any time; it reaches us directly.
  </p>`;

  const text = `SMART SCALE - FREE WEBSITE CHECK

${line} on ${site}.

${report.sections.map((s) => `${s.title}: ${RATING_LABEL[s.rating]}`).join("\n")}

${
  clean
    ? `${CLEAN_NOTE}\n\nBook a free call: ${BOOKING_URL}`
    : `WHAT MATTERS MOST\n${top.map((f) => `- ${f.title}. ${f.plain}`).join("\n")}${links.fix ? `\n\nFix my website for me: ${links.fix}` : ""}`
}

See the full report: ${links.report}
The report link works for 90 days. Reply to this email any time; it reaches us directly.

${textFooter(footer)}`;

  return { subject, html: frame("Free website check", esc(`${line}.`), body, footer), text };
}

/* ----------------------------- could not scan ----------------------------- */

export function couldNotScanEmail(website: string, footer: Footer): Message {
  const site = website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const body = card(
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;">Our checker could not get through to ${esc(site)}. Some sites block automated visitors, and sometimes an address is typed a little differently from the one that works.</p>
     <p style="margin:0;font-size:15px;line-height:1.65;">You do not need to do anything. One of us will look at it by hand and write back with what we find.</p>`,
  );
  return {
    subject: `We couldn't reach ${site}. We'll check it by hand.`,
    html: frame("Free website check", "We couldn&#39;t reach your site.", body, footer),
    text: `SMART SCALE - FREE WEBSITE CHECK

We couldn't reach your site.

Our checker could not get through to ${site}. Some sites block automated visitors, and sometimes an address is typed a little differently from the one that works.

You do not need to do anything. One of us will look at it by hand and write back with what we find.

${textFooter(footer)}`,
  };
}

/* ------------------------------- no website ------------------------------- */

export function noWebsiteEmail(name: string, footer: Footer): Message {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const body = `${card(
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;">Thanks for telling us what you need. Here is what happens next.</p>
     <p style="margin:0 0 8px;font-size:15px;line-height:1.65;"><strong>1.</strong> One of us calls you within one business day.</p>
     <p style="margin:0 0 8px;font-size:15px;line-height:1.65;"><strong>2.</strong> We talk through your business and what would help first.</p>
     <p style="margin:0;font-size:15px;line-height:1.65;"><strong>3.</strong> You get a plan in writing. There is no obligation.</p>`,
  )}
  <div style="margin-bottom:8px;">${button(BOOKING_URL, "Pick a time for the call", true)}</div>
  <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">Prefer to call us? ${BUSINESS.phone.display}. Or reply to this email; it reaches us directly.</p>`;
  return {
    subject: "We got your request. Here is what happens next.",
    html: frame("Smart Scale", esc(`Thanks${first ? `, ${first}` : ""}. We'll call you within one business day.`), body, footer),
    text: `SMART SCALE

Thanks${first ? `, ${first}` : ""}. We'll call you within one business day.

1. One of us calls you within one business day.
2. We talk through your business and what would help first.
3. You get a plan in writing. There is no obligation.

Pick a time for the call: ${BOOKING_URL}
Prefer to call us? ${BUSINESS.phone.display}. Or reply to this email; it reaches us directly.

${textFooter(footer)}`,
  };
}

/* --------------------------------- sending -------------------------------- */

export type OwnerSend = { sent: boolean; reason?: "no-address" | "unsubscribed" | "held" | "already" | "failed"; error?: string };

/**
 * Sends one message to a lead, once, and writes what happened on the
 * timeline. `kind` names the message; with the lead (and the scan, when
 * there is one) it is the key that stops a second copy.
 */
export async function sendToOwner(
  lead: Lead,
  kind: "report" | "could-not-scan" | "no-website",
  build: (footer: Footer) => Message,
  scope = "",
): Promise<OwnerSend> {
  if (!lead.email) return { sent: false, reason: "no-address" };
  if (lead.emailOptOut || (await isEmailSuppressed(lead.email))) return { sent: false, reason: "unsubscribed" };

  const key = `${kind}:${scope || lead.id}`;
  const settings = await getWbSettings();
  const isTeam = alertRecipients().some((a) => a.toLowerCase() === lead.email!.toLowerCase());
  if (!settings.postalAddress && !isTeam) {
    await addEvent(lead.id, "email_held", key, `${kind}: held until the postal address is set in Settings`);
    return { sent: false, reason: "held" };
  }
  if (!isEmailConfigured()) return { sent: false, reason: "failed", error: "RESEND_API_KEY is not set" };
  if (!(await claimOnce(`email:${lead.id}:${key}`))) return { sent: false, reason: "already" };

  const asked = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(
    new Date(lead.createdAt),
  );
  const unsubscribe = unsubscribeUrl(lead.id);
  const oneClick = oneClickUnsubscribeUrl(lead.id);
  const message = build({
    why:
      kind === "no-website"
        ? `You are getting this because you asked Smart Scale about getting your business online on ${asked}.`
        : `You are getting this because you asked for a free website check from Smart Scale on ${asked}.`,
    unsubscribe,
    postalAddress: settings.postalAddress,
  });

  const result = await sendEmail({
    to: lead.email,
    ...message,
    headers: oneClick ? { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
  });
  if (!result.ok) {
    await releaseOnce(`email:${lead.id}:${key}`);
    return { sent: false, reason: "failed", error: result.error };
  }
  await addEvent(lead.id, "email_sent", key, kind);
  return { sent: true };
}

/** Where a visitor reads their report. */
export const reportUrl = (reportId: string) => `${SITE_URL}/check/report/${reportId}`;

/** The two links a report email carries. */
export function reportLinks(lead: Lead, reportId: string) {
  return { report: reportUrl(reportId), fix: fixUrl(lead.id) };
}
