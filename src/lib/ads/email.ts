/**
 * Advertiser-facing email, sent through Resend's REST API.
 *
 * Dependency-free on purpose — it's one HTTPS call, and the rest of this
 * folder already talks to Upstash and Twilio the same way. Degrades to a
 * recorded skip when unconfigured rather than throwing inside the daily job.
 */

import { formatDate, type AdvertiserView } from "./roster";

/** Overridable so the send path can be pointed at a local stand-in under test. */
function resendEndpoint(): string {
  const base = (process.env.RESEND_API_BASE || "https://api.resend.com").replace(/\/$/, "");
  return `${base}/emails`;
}

export function fromAddress(): string {
  return process.env.ADS_FROM_EMAIL || "Smart Scale <ads@smartscaleagent.com>";
}

export function replyToAddress(): string | undefined {
  return process.env.ADS_REPLY_TO || undefined;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export type EmailResult = { ok: boolean; error?: string };

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };

  try {
    const res = await fetch(resendEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [message.to],
        reply_to: replyToAddress(),
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}

/* ------------------------------ renewal email ----------------------------- */

const INK = "#1a1210";
const MUTED = "#7a6a5d";
const RED = "#DC2626";
const CREAM = "#faf6f0";

function button(href: string, label: string, primary: boolean): string {
  const bg = primary ? RED : "#ffffff";
  const color = primary ? "#ffffff" : INK;
  const border = primary ? RED : "rgba(0,0,0,0.12)";
  return `<a href="${href}" style="display:inline-block;background:${bg};color:${color};border:1px solid ${border};border-radius:10px;padding:12px 22px;font-weight:600;font-size:15px;text-decoration:none;margin:0 8px 10px 0;">${label}</a>`;
}

export type RenewalEmailLinks = {
  renew: string;
  change: string;
  cancel: string;
};

/**
 * The copy leads with what they got for their money, because that is the
 * question they're actually asking when this lands.
 */
export function renewalEmail(
  view: AdvertiserView,
  links: RenewalEmailLinks,
  scanTotal?: number,
) {
  const daysLeft = view.daysRemaining;
  const urgency =
    daysLeft <= 0
      ? "ends today"
      : daysLeft === 1
        ? "ends tomorrow"
        : `ends in ${daysLeft} days`;

  const subject =
    daysLeft <= 0
      ? `Your ad at Mex Taco House ends today`
      : `Your ad at Mex Taco House ${urgency}`;

  const scanLine =
    scanTotal && scanTotal > 0
      ? `Since you started, guests have scanned your QR code <strong>${scanTotal.toLocaleString()}</strong> time${scanTotal === 1 ? "" : "s"}.`
      : "";

  const scanLineText =
    scanTotal && scanTotal > 0
      ? `Since you started, guests have scanned your QR code ${scanTotal.toLocaleString()} time${scanTotal === 1 ? "" : "s"}.\n\n`
      : "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${RED};font-weight:700;">Mex Taco House · Screen Advertising</p>
  <h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;font-weight:600;">Your spot ${urgency}</h1>

  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:22px 24px;margin-bottom:24px;">
    <p style="margin:0 0 10px;font-size:15px;line-height:1.6;">Hi${view.contactName ? ` ${view.contactName}` : ""},</p>
    <p style="margin:0 0 10px;font-size:15px;line-height:1.6;">
      <strong>${view.business}</strong> has been running on the dining-room screens at Mex Taco House${view.category ? ` as our only <strong>${view.category}</strong> advertiser` : ""}. Your ${view.planName} term ends on <strong>${formatDate(view.endDate)}</strong>.
    </p>
    ${scanLine ? `<p style="margin:0 0 10px;font-size:15px;line-height:1.6;">${scanLine}</p>` : ""}
    <p style="margin:0;font-size:15px;line-height:1.6;color:${MUTED};">
      Renewing keeps your category locked. If the term lapses, it goes back on the market and another business in your category can take it.
    </p>
  </div>

  <p style="margin:0 0 14px;font-size:15px;font-weight:600;">What would you like to do?</p>
  <div style="margin-bottom:8px;">
    ${button(links.renew, "Renew my spot", true)}
    ${button(links.change, "Change my package", false)}
    ${button(links.cancel, "End my run", false)}
  </div>
  <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
    Nothing changes until you confirm on the next screen, and we'll follow up personally either way. Questions? Just reply to this email.
  </p>

  <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#9a8b7d;">
    Mex Taco House screen advertising is managed by Smart Scale.
  </p>
</div>
</body></html>`;

  const text = `MEX TACO HOUSE - SCREEN ADVERTISING

Your spot ${urgency}.

Hi${view.contactName ? ` ${view.contactName}` : ""},

${view.business} has been running on the dining-room screens at Mex Taco House${view.category ? ` as our only ${view.category} advertiser` : ""}. Your ${view.planName} term ends on ${formatDate(view.endDate)}.

${scanLineText}Renewing keeps your category locked. If the term lapses, it goes back on the market and another business in your category can take it.

What would you like to do?

  Renew my spot:      ${links.renew}
  Change my package:  ${links.change}
  End my run:         ${links.cancel}

Nothing changes until you confirm on the next screen, and we'll follow up personally either way. Questions? Just reply to this email.

Mex Taco House screen advertising is managed by Smart Scale.`;

  return { subject, html, text };
}
