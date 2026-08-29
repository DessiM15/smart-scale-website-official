/**
 * Advertiser-facing email, sent through Plunk's REST API.
 *
 * Dependency-free on purpose — it's one HTTPS call, and the rest of this
 * folder already talks to Upstash and Twilio the same way. Degrades to a
 * recorded skip when unconfigured rather than throwing inside the daily job.
 */

import { addMonths, formatDate, toView, type AdvertiserView } from "./roster";
import type { ReportFacts } from "./report-data";
import type { Narrative } from "./narrative";

/** Overridable so the send path can be pointed at a local stand-in under test. */
function plunkEndpoint(): string {
  const base = (process.env.PLUNK_API_BASE || "https://api.useplunk.com").replace(
    /\/$/,
    "",
  );
  return `${base}/v1/send`;
}

/** The full "Name <address>" form, for display and for our own templates. */
export function fromAddress(): string {
  return process.env.ADS_FROM_EMAIL || "Smart Scale <ads@smartscaleagent.com>";
}

/**
 * Plunk wants the sender split: a bare address, and the display name beside it.
 * Accepts either form in ADS_FROM_EMAIL so the variable doesn't have to change
 * shape depending on who is delivering the mail.
 */
function splitFrom(): { address: string; name?: string } {
  const raw = fromAddress().trim();
  const bracketed = raw.match(/^(.*)<([^>]+)>\s*$/);
  if (bracketed) {
    const name = bracketed[1].trim().replace(/^"|"$/g, "");
    return { address: bracketed[2].trim(), name: name || undefined };
  }
  return { address: raw };
}

export function replyToAddress(): string | undefined {
  return process.env.ADS_REPLY_TO || undefined;
}

/**
 * The API key, with surrounding whitespace removed.
 *
 * A value pasted into a dashboard field routinely arrives with a trailing
 * newline, and `Bearer sk_x…\n` is refused with the same "incorrect token"
 * message as a genuinely wrong key — which sends you regenerating keys that
 * were never the problem. Everything else in this folder trims its secrets;
 * this had not been, and it cost an evening.
 */
function apiKey(): string {
  return (process.env.PLUNK_API_KEY ?? "").trim();
}

export function isEmailConfigured(): boolean {
  return Boolean(apiKey());
}

/**
 * A description of the key this deployment is holding, safe to show on screen.
 *
 * Length, the ends, and whether it arrived with whitespace — enough to tell a
 * truncated paste from a mangled one from a wrong-project key, and not enough
 * to be worth anything to anyone reading over a shoulder. Shown only when a
 * send is refused, because that is the only moment it helps.
 */
export function keyFingerprint(): string {
  const raw = process.env.PLUNK_API_KEY ?? "";
  if (!raw) return "no key set";

  const key = raw.trim();
  const parts = [
    `${key.length} chars`,
    `starts ${key.slice(0, 3)}`,
    `ends ${key.slice(-3)}`,
  ];
  if (raw !== key) parts.push("had surrounding whitespace, now trimmed");
  if ([...key].some((c) => !/[A-Za-z0-9_-]/.test(c))) {
    parts.push("contains characters a key shouldn't — looks like a masked copy");
  }
  return parts.join(", ");
}

export type EmailResult = {
  ok: boolean;
  error?: string;
  /** Whatever the provider gave back to identify the send, for cross-checking. */
  detail?: string;
};

/**
 * What Plunk actually said.
 *
 * A 200 is not the same as a send. Providers routinely answer 200 with a body
 * saying the request was understood and refused, so the body is read on every
 * response and a missing or false `success` is treated as a failure. Reporting
 * a send that did not happen is the worst outcome available here — it sends you
 * looking at DNS and spam folders for an email that was never accepted.
 */
type PlunkResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  emails?: { contact?: { email?: string }; email?: string }[];
};

/**
 * Sends one message through Plunk.
 *
 * `text` is accepted and not sent: Plunk's transactional endpoint takes a
 * single HTML body. The templates still build a plain-text part because it
 * costs nothing, it is the version a person can actually read back in a log,
 * and it means the provider underneath can change again without rewriting
 * every email in this file.
 */
export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const key = apiKey();
  if (!key) return { ok: false, error: "PLUNK_API_KEY is not set" };

  const sender = splitFrom();

  try {
    const res = await fetch(plunkEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: message.to,
        subject: message.subject,
        body: message.html,
        from: sender.address,
        name: sender.name,
        reply: replyToAddress(),
        // These are contract and renewal notices to people we already do
        // business with. Adding them to a marketing contact list as a side
        // effect of being sent one is not something they agreed to.
        subscribed: false,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const raw = await res.text();
    let parsed: PlunkResponse | null = null;
    try {
      parsed = raw ? (JSON.parse(raw) as PlunkResponse) : null;
    } catch {
      // Not JSON. The raw text is still the most useful thing to report.
    }

    const said = parsed?.message || parsed?.error || raw.slice(0, 200);

    if (!res.ok) {
      return { ok: false, error: `Plunk ${res.status}: ${said || "no detail given"}` };
    }

    // A 200 carrying success:false is a refusal wearing a success code.
    if (parsed && parsed.success === false) {
      return {
        ok: false,
        error: `Plunk accepted the request but refused the send: ${said || "no reason given"}`,
      };
    }

    // No recognisable body at all means we cannot say it sent, so we don't.
    if (!parsed) {
      return {
        ok: false,
        error: `Plunk answered ${res.status} with nothing we could read: ${raw.slice(0, 200) || "(empty)"}`,
      };
    }

    const delivered = parsed.emails?.length ?? 0;
    return {
      ok: true,
      detail: delivered > 0 ? `${delivered} queued by Plunk` : "accepted by Plunk",
    };
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

/** The venue these emails are about, kept in step with the agreement template. */
const VENUE_NAME = "Mex Taco House";

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

/* ------------------------------ monthly report ---------------------------- */

function statTile(value: string, label: string): string {
  return `<td style="padding:0 6px;" width="33%" valign="top">
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
  const subject = `${facts.business} — your ${facts.monthName} report`;

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
  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${RED};font-weight:700;">Mex Taco House · ${facts.monthName}</p>
  <h1 style="margin:0 0 6px;font-size:26px;line-height:1.25;font-weight:600;">${narrative.headline}</h1>
  <p style="margin:0 0 22px;font-size:14px;color:${MUTED};">${facts.business}${facts.category ? ` · our only ${facts.category} advertiser` : ""}</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 -6px 8px;"><tr>
    ${statTile(facts.scans.toLocaleString(), "Scans")}
    ${statTile(facts.plays.toLocaleString(), "Times played")}
    ${statTile(facts.openDays.toString(), "Days on screen")}
  </tr></table>
  ${change}

  ${termBlock}

  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:22px 24px;margin-bottom:22px;">
    <p style="margin:0;font-size:15px;line-height:1.65;">${narrative.body}</p>
    ${detail.length ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:${MUTED};">${detail.join(" ")}</p>` : ""}
  </div>

  <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:${MUTED};">
    A "scan" is someone pointing their phone at your code and opening your page — not a view. Times played is how often your ad appeared on the screens, counted only for the days it was actually running.
  </p>
  <p style="margin:0;font-size:12px;line-height:1.6;color:#9a8b7d;">
    Questions, or want to change your artwork? Just reply to this email. Mex Taco House screen advertising is managed by Smart Scale.
  </p>
</div>
</body></html>`;

  const text = `MEX TACO HOUSE - ${facts.monthName.toUpperCase()}

${narrative.headline}
${facts.business}${facts.category ? ` - our only ${facts.category} advertiser` : ""}

  Scans:          ${facts.scans.toLocaleString()}
  Times played:   ${facts.plays.toLocaleString()}
  Days on screen: ${facts.openDays}
${facts.changePercent === null ? "" : `\n${facts.changePercent >= 0 ? "Up" : "Down"} ${Math.abs(facts.changePercent)}% on ${facts.previousScans} the month before.\n`}${termText}
${narrative.body}
${detail.length ? `\n${detail.join(" ")}\n` : ""}
A "scan" is someone pointing their phone at your code and opening your page - not a view. Times played is how often your ad appeared on the screens, counted only for the days it was actually running.

Questions, or want to change your artwork? Just reply to this email.
Mex Taco House screen advertising is managed by Smart Scale.`;

  return { subject, html, text };
}

/* -------------------------------- test send ------------------------------- */

export type TestKind = "delivery" | "renewal";

/**
 * A message you send yourself to prove the pipe works before a client is on the
 * other end of it.
 *
 * Two kinds, because they fail differently. "delivery" is the smallest possible
 * message and answers "did Plunk accept it and did DNS let it land?".
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
    Sent from the Mex Taco ad tracker to check that email is working. No client received this.
  </div>`;

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
    If you are reading this, Plunk accepted the message and your domain records let it land. Renewal notices and monthly reports can go out.
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

If you are reading this, Plunk accepted the message and your domain records let it land.

  Sent from:      ${from}
  Replies go to:  ${replyTo || "the sending address"}

One thing worth checking now: hit reply. Every client email invites a reply, so if nothing receives at the address above, those replies bounce.`;

  return { subject: "[Test] Mex Taco ad tracker — email check", html, text };
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
  },
  signUrl: string,
) {
  const subject = `Your ${VENUE_NAME} advertising agreement — ready to sign`;
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
) {
  const subject = `Signed — your ${VENUE_NAME} advertising agreement`;

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
