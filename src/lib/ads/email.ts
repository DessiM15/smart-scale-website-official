/**
 * Email for the ad business, sent through Resend's REST API.
 *
 * Dependency-free on purpose: it is one HTTPS call, and the rest of this
 * folder already talks to Upstash the same way. Degrades to a recorded skip
 * when unconfigured rather than throwing inside the daily job.
 *
 * Three behaviours here outlived two provider swaps and must survive the
 * next: the key is trimmed (a pasted newline fails identically to a wrong
 * key), the response body is read on every reply (a 2xx without a message id
 * claims nothing), and a refused key is described on screen by its length and
 * ends rather than guessed at.
 */

import { addMonths, formatDate, toView, type AdvertiserView } from "./roster";
import type { ReportFacts } from "./report-data";
import type { Narrative } from "./narrative";
import { SALES_CONTACT } from "./contact";

/** Overridable so the send path can be pointed at a local stand-in under test. */
function resendEndpoint(): string {
  const base = (process.env.RESEND_API_BASE || "https://api.resend.com").replace(
    /\/$/,
    "",
  );
  return `${base}/emails`;
}

/** The API key, with surrounding whitespace removed. */
function apiKey(): string {
  return (process.env.RESEND_API_KEY ?? "").trim();
}

/**
 * The sender, in the "Name <address>" form Resend takes whole. The address must
 * be on a domain verified in the Resend account, or the send is refused.
 */
export function fromAddress(): string {
  return process.env.ADS_FROM_EMAIL || "Smart Scale <info@smartscaleagent.com>";
}

export function replyToAddress(): string | undefined {
  return process.env.ADS_REPLY_TO || undefined;
}

export function isEmailConfigured(): boolean {
  return Boolean(apiKey());
}

/**
 * A description of the key this deployment is holding, safe to show on screen.
 *
 * Length, the ends, and whether it arrived with whitespace: enough to tell a
 * truncated paste from a mangled one from a wrong-account key, and not enough
 * to be worth anything to someone reading over a shoulder. Shown only when a
 * send is refused, because that is the only moment it helps.
 */
export function keyFingerprint(): string {
  const raw = process.env.RESEND_API_KEY ?? "";
  if (!raw) return "no key set";

  const key = raw.trim();
  const parts = [
    `${key.length} chars`,
    `starts ${key.slice(0, 3)}`,
    `ends ${key.slice(-3)}`,
  ];
  if (raw !== key) parts.push("had surrounding whitespace, now trimmed");
  if ([...key].some((c) => !/[A-Za-z0-9_-]/.test(c))) {
    parts.push("contains characters a key shouldn't, looks like a masked copy");
  }
  return parts.join(", ");
}

export type EmailResult = {
  ok: boolean;
  error?: string;
  /** Resend's id for the message, for cross-checking against its own log. */
  detail?: string;
};

/**
 * What Resend actually said.
 *
 * A 2xx is not on its own proof of a send, and the body is where the reason
 * lives when something is refused. Reporting a send that did not happen is the
 * worst outcome available here: it sends you looking at DNS and spam folders
 * for an email that was never accepted.
 */
type ResendResponse = {
  id?: string;
  name?: string;
  message?: string;
  statusCode?: number;
};

export type Attachment = {
  filename: string;
  /** Base64 of the file's bytes, which is what Resend's JSON API takes. */
  content: string;
  contentType?: string;
};

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
  /** Overrides the default reply-to for this one message. */
  replyTo?: string;
}): Promise<EmailResult> {
  const key = apiKey();
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
        reply_to: message.replyTo ?? replyToAddress(),
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.attachments?.length
          ? {
              attachments: message.attachments.map((a) => ({
                filename: a.filename,
                content: a.content,
                ...(a.contentType ? { content_type: a.contentType } : {}),
              })),
            }
          : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const raw = await res.text();
    let parsed: ResendResponse | null = null;
    try {
      parsed = raw ? (JSON.parse(raw) as ResendResponse) : null;
    } catch {
      // Not JSON. The raw text is still the most useful thing to report.
    }

    const said = parsed?.message || parsed?.name || raw.slice(0, 200);

    if (!res.ok) {
      return { ok: false, error: `Resend ${res.status}: ${said || "no detail given"}` };
    }

    // Accepted means an id came back. Anything else is a response we cannot
    // read, and a response we cannot read is not evidence that it sent.
    if (!parsed?.id) {
      return {
        ok: false,
        error: `Resend answered ${res.status} without a message id: ${raw.slice(0, 200) || "(empty)"}`,
      };
    }

    return { ok: true, detail: `Resend id ${parsed.id}` };
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

/** What emails say when a record predates locations: the first one. */
const DEFAULT_VENUE_NAME = "Mex Taco House";

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
 * The renewal notice. Leads with what they got for their money, because that
 * is the question they're actually asking when this lands, then makes the
 * two things Dessi wants easy: renew in one tap, or call, because a renewal
 * is where a better deal can be offered (2026-09-21).
 *
 * Sent at 90 days (six- and twelve-month terms), 30 days, and 7 days.
 */
export function renewalEmail(
  view: AdvertiserView,
  links: RenewalEmailLinks,
  scanTotal?: number,
  venueName: string = DEFAULT_VENUE_NAME,
) {
  const VENUE_NAME = venueName;
  const daysLeft = view.daysRemaining;
  const when =
    daysLeft <= 0
      ? "ends today"
      : daysLeft === 1
        ? "ends tomorrow"
        : daysLeft >= 85
          ? "ends in three months"
          : daysLeft >= 28
            ? "ends in a month"
            : `ends in ${daysLeft} days`;

  const subject =
    daysLeft <= 7
      ? `${view.business}: your spot at ${VENUE_NAME} ${when}`
      : `${view.business}: your ${VENUE_NAME} spot ${when}. Let's keep it yours.`;

  const scanLine =
    scanTotal && scanTotal > 0
      ? `Since you started, guests have scanned your QR code <strong>${scanTotal.toLocaleString()}</strong> time${scanTotal === 1 ? "" : "s"}.`
      : "";
  const scanLineText =
    scanTotal && scanTotal > 0
      ? `Since you started, guests have scanned your QR code ${scanTotal.toLocaleString()} time${scanTotal === 1 ? "" : "s"}.\n\n`
      : "";

  const held = view.category
    ? `as the only <strong>${view.category}</strong> business in the rotation`
    : "on the dining-room screens";
  const heldText = view.category
    ? `as the only ${view.category} business in the rotation`
    : "on the dining-room screens";

  const callLine = `Call ${SALES_CONTACT.name} at <a href="${SALES_CONTACT.phoneHref}" style="color:${INK};font-weight:600;">${SALES_CONTACT.phoneDisplay}</a> before you decide. Clients who renew with us may qualify for a special offer, and it only takes a minute to find out.`;
  const callText = `Call ${SALES_CONTACT.name} at ${SALES_CONTACT.phoneDisplay} before you decide. Clients who renew with us may qualify for a special offer, and it only takes a minute to find out.`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;"><tr>
    <td style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${RED};font-weight:700;">${VENUE_NAME} · Screen Advertising</td>
    <td align="right" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9a8b7d;font-weight:700;">Smart Scale</td>
  </tr></table>

  <h1 style="margin:0 0 6px;font-size:28px;line-height:1.2;font-weight:600;">Your spot ${when}.</h1>
  <p style="margin:0 0 22px;font-size:16px;line-height:1.5;color:${MUTED};">Let's keep it yours.</p>

  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-left:4px solid ${RED};border-radius:16px;padding:22px 24px;margin-bottom:22px;">
    <p style="margin:0 0 10px;font-size:15px;line-height:1.6;">Hi${view.contactName ? ` ${view.contactName}` : ""},</p>
    <p style="margin:0 0 10px;font-size:15px;line-height:1.6;">
      <strong>${view.business}</strong> has been running at ${VENUE_NAME} ${held}. Your ${view.planName} term ends on <strong>${formatDate(view.endDate)}</strong>.
    </p>
    ${scanLine ? `<p style="margin:0 0 10px;font-size:15px;line-height:1.6;">${scanLine}</p>` : ""}
    <p style="margin:0;font-size:15px;line-height:1.6;color:${MUTED};">
      Renewing keeps your category locked. If the term lapses, it goes back on the market and another business in your category can take it.
    </p>
  </div>

  <div style="background:${INK};color:#ffffff;border-radius:16px;padding:20px 24px;margin-bottom:22px;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#f3b1ac;font-weight:700;">Before you decide</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#ffffff;">${callLine.replace(`color:${INK}`, "color:#ffffff")}</p>
  </div>

  <p style="margin:0 0 12px;font-size:15px;font-weight:600;">Or answer right here:</p>
  <div style="margin-bottom:8px;">
    ${button(links.renew, "Renew my spot", true)}
    ${button(links.change, "Change my package", false)}
    ${button(links.cancel, "End my run", false)}
  </div>
  <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
    Nothing changes until you confirm on the next screen, and we'll follow up personally either way. Questions? Reply to this email or call ${SALES_CONTACT.phoneDisplay}.
  </p>

  <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#9a8b7d;">
    ${VENUE_NAME} screen advertising is managed by Smart Scale, Katy, TX.
  </p>
</div>
</body></html>`;

  const text = `${VENUE_NAME.toUpperCase()} - SCREEN ADVERTISING

Your spot ${when}. Let's keep it yours.

Hi${view.contactName ? ` ${view.contactName}` : ""},

${view.business} has been running at ${VENUE_NAME} ${heldText}. Your ${view.planName} term ends on ${formatDate(view.endDate)}.

${scanLineText}Renewing keeps your category locked. If the term lapses, it goes back on the market and another business in your category can take it.

BEFORE YOU DECIDE
${callText}

Or answer right here:

  Renew my spot:      ${links.renew}
  Change my package:  ${links.change}
  End my run:         ${links.cancel}

Nothing changes until you confirm on the next screen, and we'll follow up personally either way. Questions? Reply to this email or call ${SALES_CONTACT.phoneDisplay}.

${VENUE_NAME} screen advertising is managed by Smart Scale, Katy, TX.`;

  return { subject, html, text };
}

/* ------------------------------ monthly report ---------------------------- */

function statTile(value: string, label: string, width = "33%"): string {
  return `<td style="padding:0 6px;" width="${width}" valign="top">
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:14px;padding:16px 14px;text-align:center;">
      <div style="font-size:28px;font-weight:600;color:${INK};line-height:1.1;">${value}</div>
      <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9a8b7d;font-weight:700;margin-top:6px;">${label}</div>
    </div>
  </td>`;
}

/**
 * The monthly report. Every figure comes from `facts`; the only free text is
 * the narrative, which has already been checked for invented numbers.
 */
export function reportEmail(facts: ReportFacts, narrative: Narrative) {
  const VENUE_NAME = facts.venueName || DEFAULT_VENUE_NAME;
  // Reports drafted before the venue had a guest count carry no viewers.
  const viewers = typeof facts.viewers === "number" ? facts.viewers : null;
  const tileWidth = viewers !== null ? "25%" : "33%";
  const viewersNote =
    viewers !== null
      ? ` "People who saw it" is an estimate: ${VENUE_NAME} sees about ${facts.monthlyGuests.toLocaleString()} guests a month, your ad plays every few minutes during every open hour, and your ad was on screen ${facts.openDays} of the ${facts.venueOpenDays} days they were open.`
      : "";
  const subject = `${facts.business}, your ${facts.monthName} report`;

  const change =
    facts.changePercent === null
      ? ""
      : `<p style="margin:0 0 18px;font-size:14px;color:${MUTED};">
           ${facts.changePercent >= 0 ? "Up" : "Down"} ${Math.abs(facts.changePercent)}% on ${facts.previousScans} the month before.
         </p>`;

  // The whole run so far, shown once it is worth showing — a first month has
  // nothing to compare against, and repeating the month's own figures under a
  // different heading would read as padding.
  const showTerm =
    facts.termOpenDays > facts.openDays && (facts.termScans > 0 || facts.termPlays > 0);

  const termBlock = showTerm
    ? `<div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:20px 24px;margin-bottom:22px;">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9a8b7d;font-weight:700;">
          ${facts.termComplete ? "Your full run" : "Since you started"}
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:5px 0;font-size:14px;color:${MUTED};">Scans</td>
            <td style="padding:5px 0;font-size:14px;color:${INK};font-weight:600;text-align:right;">${facts.termScans.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:14px;color:${MUTED};">Times played</td>
            <td style="padding:5px 0;font-size:14px;color:${INK};font-weight:600;text-align:right;">${facts.termPlays.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:14px;color:${MUTED};">Days on screen</td>
            <td style="padding:5px 0;font-size:14px;color:${INK};font-weight:600;text-align:right;">${facts.termOpenDays.toLocaleString()}</td>
          </tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#9a8b7d;">
          ${formatDate(facts.termFrom)} to ${formatDate(facts.termTo)}.
        </p>
      </div>`
    : "";

  const termText = showTerm
    ? `\n${facts.termComplete ? "YOUR FULL RUN" : "SINCE YOU STARTED"} (${formatDate(facts.termFrom)} to ${formatDate(facts.termTo)})\n\n  Scans:          ${facts.termScans.toLocaleString()}\n  Times played:   ${facts.termPlays.toLocaleString()}\n  Days on screen: ${facts.termOpenDays.toLocaleString()}\n`
    : "";

  const detail: string[] = [];
  if (facts.bestDay) {
    detail.push(`Your busiest day was ${facts.bestDay.label}, with ${facts.bestDay.count} scan${facts.bestDay.count === 1 ? "" : "s"}.`);
  }
  if (facts.bestHourWindow) {
    detail.push(`Most scans happen between ${facts.bestHourWindow}.`);
  }
  if (facts.uniquePhones > 0) {
    detail.push(`${facts.uniquePhones} distinct phone${facts.uniquePhones === 1 ? " has" : "s have"} scanned your code since you started.`);
  }
  // Where the diners came from is often the most useful line in the whole
  // report to a business deciding where to spend next.
  if (facts.topPlaces.length > 0) {
    const places = facts.topPlaces.slice(0, 3).map((p) => p.name);
    const list =
      places.length === 1
        ? places[0]
        : `${places.slice(0, -1).join(", ")} and ${places[places.length - 1]}`;
    detail.push(`Most of those scans came from ${list}.`);
  }

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${RED};font-weight:700;">${VENUE_NAME} · ${facts.monthName}</p>
  <h1 style="margin:0 0 6px;font-size:26px;line-height:1.25;font-weight:600;">${narrative.headline}</h1>
  <p style="margin:0 0 22px;font-size:14px;color:${MUTED};">${facts.business}${facts.category ? ` · our only ${facts.category} advertiser` : ""}</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 -6px 8px;"><tr>
    ${statTile(facts.plays.toLocaleString(), "Times played", tileWidth)}
    ${viewers !== null ? statTile(`~${viewers.toLocaleString()}`, "People who saw it", tileWidth) : ""}
    ${statTile(facts.scans.toLocaleString(), "Scans", tileWidth)}
    ${statTile(facts.openDays.toString(), "Days on screen", tileWidth)}
  </tr></table>
  ${change}

  ${termBlock}

  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:22px 24px;margin-bottom:22px;">
    <p style="margin:0;font-size:15px;line-height:1.65;">${narrative.body}</p>
    ${detail.length ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:${MUTED};">${detail.join(" ")}</p>` : ""}
  </div>

  <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:${MUTED};">
    A "scan" is someone pointing their phone at your code and opening your page, not a view. Times played is how often your ad appeared on the screens, counted only for the days it was actually running.${viewersNote}
  </p>
  <p style="margin:0;font-size:12px;line-height:1.6;color:#9a8b7d;">
    Questions, or want to change your artwork? Just reply to this email. ${VENUE_NAME} screen advertising is managed by Smart Scale.
  </p>
</div>
</body></html>`;

  const text = `${VENUE_NAME.toUpperCase()} - ${facts.monthName.toUpperCase()}

${narrative.headline}
${facts.business}${facts.category ? ` - our only ${facts.category} advertiser` : ""}

  Times played:      ${facts.plays.toLocaleString()}
${viewers !== null ? `  People who saw it: ~${viewers.toLocaleString()}\n` : ""}  Scans:             ${facts.scans.toLocaleString()}
  Days on screen:    ${facts.openDays}
${facts.changePercent === null ? "" : `\n${facts.changePercent >= 0 ? "Up" : "Down"} ${Math.abs(facts.changePercent)}% on ${facts.previousScans} the month before.\n`}${termText}
${narrative.body}
${detail.length ? `\n${detail.join(" ")}\n` : ""}
A "scan" is someone pointing their phone at your code and opening your page, not a view. Times played is how often your ad appeared on the screens, counted only for the days it was actually running.${viewersNote}

Questions, or want to change your artwork? Just reply to this email.
${VENUE_NAME} screen advertising is managed by Smart Scale.`;

  return { subject, html, text };
}

/* -------------------------------- test send ------------------------------- */

export type TestKind = "delivery" | "renewal" | "lead";

/**
 * A message you send yourself to prove the pipe works before a client is on the
 * other end of it.
 *
 * Two kinds, because they fail differently. "delivery" is the smallest possible
 * message and answers "did Resend accept it and did DNS let it land?".
 * "renewal" is the actual template with invented figures, and answers "does it
 * look right, is the reply address mine, do the buttons render?".
 *
 * Everything is marked as a test in the subject, in the first line and in the
 * plain-text part, so a forwarded copy can't be mistaken for the real thing.
 */
export function testEmail(kind: TestKind) {
  const from = fromAddress();
  const replyTo = replyToAddress();

  const banner = `<div style="background:${INK};color:#ffffff;padding:14px 18px;border-radius:12px;margin-bottom:20px;font-size:13px;line-height:1.5;">
    <strong style="letter-spacing:0.08em;text-transform:uppercase;font-size:11px;">Test message</strong><br/>
    Sent from Smart Scale Ad Ops to check that email is working. No client received this.
  </div>`;

  if (kind === "lead") {
    const built = leadReplyEmail({
      name: "Alex Rivera",
      business: "Sample Plumbing Co.",
      industry: "Plumbing",
    });
    return {
      subject: `[Test] ${built.subject}`,
      html: built.html.replace(/(<div style="max-width:560px[^>]*>)/, `$1${banner}`),
      text: `*** TEST MESSAGE — no lead received this. The name and business are invented. ***\n\n${built.text}`,
    };
  }

  if (kind === "renewal") {
    // A term ending in seven days, so the sample lands on the middle notice —
    // the one with all three buttons showing.
    const today = new Date();
    const end = new Date(today.getTime() + 7 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const start = addMonths(end, -6);

    const sample = toView({
      id: "sample",
      business: "Sample Plumbing Co.",
      contactName: "Alex",
      email: "",
      phone: "",
      category: "Plumbing",
      plan: "standard",
      startDate: start,
      status: "active",
      qrCode: "",
      notes: "",
      createdAt: "",
      updatedAt: "",
    });

    const built = renewalEmail(
      sample,
      {
        // Deliberately inert. A live token would let anyone with the test email
        // act on a real advertiser's term.
        renew: "https://smartscaleagent.com/advertise",
        change: "https://smartscaleagent.com/advertise",
        cancel: "https://smartscaleagent.com/advertise",
      },
      412,
    );

    return {
      subject: `[Test] ${built.subject}`,
      html: built.html.replace(
        /(<div style="max-width:560px[^>]*>)/,
        `$1${banner}`,
      ),
      text: `*** TEST MESSAGE — no client received this. The figures below are invented. ***\n\n${built.text}`,
    };
  }

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  ${banner}
  <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;font-weight:600;">Email is working.</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
    If you are reading this, Resend accepted the message and your domain records let it land. Renewal notices, monthly reports and the team's own alerts can go out.
  </p>
  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:14px;padding:18px 20px;font-size:14px;line-height:1.7;">
    <div><span style="color:${MUTED};">Sent from</span> <strong>${from}</strong></div>
    <div><span style="color:${MUTED};">Replies go to</span> <strong>${replyTo || "the sending address"}</strong></div>
  </div>
  <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">
    One thing worth checking now: hit reply. Every client email invites a reply, so if nothing receives at the address above, those replies bounce.
  </p>
</div>
</body></html>`;

  const text = `*** TEST MESSAGE — no client received this. ***

EMAIL IS WORKING.

If you are reading this, Resend accepted the message and your domain records let it land.

  Sent from:      ${from}
  Replies go to:  ${replyTo || "the sending address"}

One thing worth checking now: hit reply. Every client email invites a reply, so if nothing receives at the address above, those replies bounce.`;

  return { subject: "[Test] Smart Scale Ad Ops email check", html, text };
}

/* ---------------------------- agreement to sign --------------------------- */

/**
 * The email that carries the agreement.
 *
 * Short on purpose. The terms are on the page behind the link, and repeating
 * them here would create a second version of the document that nobody hashed.
 * What belongs in the email is the few facts they'd want before clicking, and
 * a clear statement that clicking does not commit them to anything.
 */
export function agreementEmail(
  terms: {
    business: string;
    contactName: string;
    category: string;
    planName: string;
    monthly: number;
    setup: number;
    months: number;
    startDate: string;
    endDate: string;
    venueName?: string;
  },
  signUrl: string,
) {
  const VENUE_NAME = terms.venueName || DEFAULT_VENUE_NAME;
  const subject = `Your ${VENUE_NAME} advertising agreement is ready to sign`;
  const rate =
    terms.monthly > 0
      ? `$${terms.monthly.toLocaleString()}/month`
      : "no monthly charge";

  const rows: [string, string][] = [
    ["Business", terms.business],
    ...(terms.category ? ([["Category held", terms.category]] as [string, string][]) : []),
    ["Package", `${terms.planName} · ${terms.months} months`],
    [
      "Rate",
      `${rate}${terms.setup > 0 ? ` · $${terms.setup.toLocaleString()} setup` : ""}`,
    ],
    ["Runs", `${formatDate(terms.startDate)} → ${formatDate(terms.endDate)}`],
  ];

  const rowHtml = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:7px 0;font-size:14px;color:${MUTED};">${label}</td>
          <td style="padding:7px 0;font-size:14px;color:${INK};font-weight:600;text-align:right;">${value}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${RED};font-weight:700;">${VENUE_NAME} · Screen Advertising</p>
  <h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;font-weight:600;">Your agreement is ready</h1>

  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:22px 24px;margin-bottom:24px;">
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Hi${terms.contactName ? ` ${terms.contactName}` : ""}, here is what we agreed:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rowHtml}</table>
  </div>

  <div style="margin-bottom:10px;">
    ${button(signUrl, "Read and sign", true)}
  </div>
  <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
    The full terms are on that page. Nothing is agreed until you type your name and confirm, and you'll get a copy the moment you do. If anything above looks wrong, just reply to this email and we'll fix it before you sign.
  </p>

  <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#9a8b7d;">
    ${VENUE_NAME} screen advertising is managed by Smart Scale.
  </p>
</div>
</body></html>`;

  const text = `${VENUE_NAME.toUpperCase()} - SCREEN ADVERTISING

Your agreement is ready.

Hi${terms.contactName ? ` ${terms.contactName}` : ""}, here is what we agreed:

${rows.map(([label, value]) => `  ${label}: ${value}`).join("\n")}

Read and sign: ${signUrl}

The full terms are on that page. Nothing is agreed until you type your name and confirm, and you'll get a copy the moment you do. If anything above looks wrong, just reply to this email and we'll fix it before you sign.

${VENUE_NAME} screen advertising is managed by Smart Scale.`;

  return { subject, html, text };
}

/** The copy the client keeps. Sent to them the moment they sign. */
export function agreementCopyEmail(
  business: string,
  signerName: string,
  signedAt: string,
  body: string,
  venueName: string = DEFAULT_VENUE_NAME,
) {
  const VENUE_NAME = venueName;
  const subject = `Signed: your ${VENUE_NAME} advertising agreement`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<div style="max-width:640px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${RED};font-weight:700;">${VENUE_NAME} · Screen Advertising</p>
  <h1 style="margin:0 0 8px;font-size:26px;line-height:1.25;font-weight:600;">Signed, and here's your copy</h1>
  <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:${MUTED};">
    Signed by ${signerName} on ${signedAt} for ${business}. Keep this email — it is your record of the agreement.
  </p>
  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:24px;">
    <pre style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.65;color:${INK};white-space:pre-wrap;word-wrap:break-word;">${body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</pre>
  </div>
  <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
    Questions about any of it? Just reply to this email.
  </p>
</div>
</body></html>`;

  const text = `SIGNED - YOUR ${VENUE_NAME.toUpperCase()} ADVERTISING AGREEMENT

Signed by ${signerName} on ${signedAt} for ${business}.
Keep this email - it is your record of the agreement.

----------------------------------------------------------------

${body}

----------------------------------------------------------------

Questions about any of it? Just reply to this email.`;

  return { subject, html, text };
}

/* ------------------------------- lead reply ------------------------------- */

/** Where the current rate card lives. Fetched at send time and attached. */
export const RATE_CARD_URL =
  "https://smartscaleagent.com/print/mex-taco-rate-card-sept-2026.pdf";
export const RATE_CARD_FILENAME = "Smart-Scale-Rate-Card-Mex-Taco-House.pdf";

/**
 * The reply a lead gets the moment they send the advertise form, with the
 * rate card attached.
 *
 * Its job is set by how the call goes: Jay phones within the day, asks them
 * to open their inbox, and talks pricing and commitment off the card while
 * they look at it (Dessi, 2026-09-21). So the email is warm, short, names
 * the meal they just had, and puts the card and Jay's number where a thumb
 * lands. The prices are on the card, not repeated here, so the card stays
 * the single thing to update.
 */
export function leadReplyEmail(lead: {
  name: string;
  business: string;
  industry: string;
  venueName?: string;
}) {
  const VENUE_NAME = lead.venueName || DEFAULT_VENUE_NAME;
  const first = (lead.name || "").trim().split(/\s+/)[0] || "";
  const subject = `Thanks for scanning at ${VENUE_NAME}. Your rate card is attached.`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;"><tr>
    <td style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${RED};font-weight:700;">${VENUE_NAME} · Screen Advertising</td>
    <td align="right" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9a8b7d;font-weight:700;">Smart Scale</td>
  </tr></table>

  <h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;font-weight:600;">Thanks${first ? `, ${first}` : ""}. We hope lunch was good.</h1>

  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-left:4px solid ${RED};border-radius:16px;padding:22px 24px;margin-bottom:22px;">
    <p style="margin:0 0 12px;font-size:15px;line-height:1.65;">
      You saw one of our ads on the screens at ${VENUE_NAME} and took the time to reach out. That means a lot, and it also means you already know exactly how this works: a full dining room, every guest looking up at the screens, and one business per category on them.
    </p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.65;">
      Your rate card is attached. It has the three plans, what's included with every one of them, and the add-ons. Have a look while it's fresh.
    </p>
    <p style="margin:0;font-size:15px;line-height:1.65;">
      ${SALES_CONTACT.name} will call you shortly to answer questions and talk through which plan fits${lead.business ? ` ${lead.business}` : ""}. If you'd rather not wait, his number is below.
    </p>
  </div>

  <div style="background:${INK};color:#ffffff;border-radius:16px;padding:20px 24px;margin-bottom:22px;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#f3b1ac;font-weight:700;">One thing to know</p>
    <p style="margin:0;font-size:15px;line-height:1.6;">Categories are exclusive and go to whoever calls first. If yours is open today, it may not be next month.</p>
  </div>

  <div style="margin-bottom:8px;">
    <a href="${SALES_CONTACT.phoneHref}" style="display:inline-block;background:${RED};color:#ffffff;border-radius:10px;padding:12px 22px;font-weight:600;font-size:15px;text-decoration:none;margin:0 8px 10px 0;">Call ${SALES_CONTACT.name}: ${SALES_CONTACT.phoneDisplay}</a>
    <a href="https://smartscaleagent.com/advertise" style="display:inline-block;background:#ffffff;color:${INK};border:1px solid rgba(0,0,0,0.12);border-radius:10px;padding:12px 22px;font-weight:600;font-size:15px;text-decoration:none;margin:0 8px 10px 0;">See the screens</a>
  </div>

  <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
    Attached: ${RATE_CARD_FILENAME.replace(/-/g, " ").replace(".pdf", "")} (PDF). Reply to this email any time; it reaches us directly.
  </p>
  <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#9a8b7d;">
    ${VENUE_NAME} screen advertising is managed by Smart Scale, Katy, TX.
  </p>
</div>
</body></html>`;

  const text = `${VENUE_NAME.toUpperCase()} - SCREEN ADVERTISING

Thanks${first ? `, ${first}` : ""}. We hope lunch was good.

You saw one of our ads on the screens at ${VENUE_NAME} and took the time to reach out. That means a lot, and it also means you already know exactly how this works: a full dining room, every guest looking up at the screens, and one business per category on them.

Your rate card is attached. It has the three plans, what's included with every one of them, and the add-ons. Have a look while it's fresh.

${SALES_CONTACT.name} will call you shortly to answer questions and talk through which plan fits${lead.business ? ` ${lead.business}` : ""}. If you'd rather not wait: ${SALES_CONTACT.phoneDisplay}.

ONE THING TO KNOW
Categories are exclusive and go to whoever calls first. If yours is open today, it may not be next month.

See the screens: https://smartscaleagent.com/advertise

Attached: the rate card (PDF). Reply to this email any time; it reaches us directly.

${VENUE_NAME} screen advertising is managed by Smart Scale, Katy, TX.`;

  return { subject, html, text };
}

/**
 * The rate card as an attachment, fetched from the site so the file lives in
 * one place. A fetch failure returns null and the reply goes out without it,
 * with a note to the team, rather than not going out at all.
 */
export async function rateCardAttachment(): Promise<Attachment | null> {
  try {
    const res = await fetch(RATE_CARD_URL, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 10_000) return null;
    return { filename: RATE_CARD_FILENAME, content: bytes.toString("base64"), contentType: "application/pdf" };
  } catch {
    return null;
  }
}

/* ------------------------------- team notice ------------------------------ */

const ADMIN_URL = "https://smartscaleagent.com/advertise/admin";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * The short internal email that replaced the team text.
 *
 * Built for a phone lock screen: the subject says what happened and to whom,
 * the body is a handful of one-line facts, and there is one button into the
 * portal. Anything longer would be read later, which for a new lead is the
 * same as not read.
 */
export function teamEmail(notice: {
  subject: string;
  lines: string[];
  href?: string;
  cta?: string;
}) {
  const href = notice.href ?? ADMIN_URL;
  const cta = notice.cta ?? "Open Ad Ops";
  const lines = notice.lines.filter(Boolean);

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<div style="max-width:560px;margin:0 auto;padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${RED};font-weight:700;">Smart Scale · Ad Ops</p>
  <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;">${escapeHtml(notice.subject)}</h1>
  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:14px;padding:16px 20px;margin-bottom:18px;">
    ${lines.map((line) => `<p style="margin:0 0 6px;font-size:15px;line-height:1.5;">${escapeHtml(line)}</p>`).join("")}
  </div>
  ${button(href, cta, true)}
  <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#9a8b7d;">
    Sent to the team only. Nobody outside Smart Scale received this.
  </p>
</div>
</body></html>`;

  const text = `SMART SCALE - AD OPS

${notice.subject}

${lines.map((line) => `  ${line}`).join("\n")}

${cta}: ${href}

Sent to the team only. Nobody outside Smart Scale received this.`;

  return { subject: notice.subject, html, text };
}
