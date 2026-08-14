/**
 * Renewal watch for the Mex Taco House rotation.
 *
 * A term that lapses quietly costs a category and the revenue behind it, so a
 * daily job walks the roster and texts the team as each advertiser approaches
 * the end of their term — and keeps nagging for a while after, if a term ended
 * and nobody closed it out.
 */

import { formatDate, listAdvertisers, type AdvertiserView } from "./roster";
import {
  alreadySent,
  isAlertingConfigured,
  markSent,
  recordRun,
  sendTeamSms,
  type RunLogEntry,
} from "./notify";
import { isEmailConfigured, renewalEmail, sendEmail } from "./email";
import { isLinkSigningConfigured, renewalUrl } from "./links";
import { hasResponded } from "./responses";
import { getCodeStats } from "./scan-store";

const ADMIN_URL = "smartscaleagent.com/advertise/admin";

/**
 * Days-remaining thresholds that trigger a notice, largest first. Negative
 * values are the post-expiry nags.
 */
export const NOTICE_POINTS = [30, 14, 7, 3, 0, -1, -7, -21] as const;

/**
 * Which notice an advertiser is due for today, or null if none.
 *
 * Picks the *smallest* threshold already reached rather than requiring an exact
 * match, so a day the cron doesn't run doesn't silently skip a warning — it
 * just arrives a little late. It also means a long outage won't fire a stale
 * 30-day notice at 5 days out; you get the 3-day one, which is the right call.
 */
export function milestoneFor(daysRemaining: number): number | null {
  const reached = NOTICE_POINTS.filter((point) => daysRemaining <= point);
  return reached.length > 0 ? Math.min(...reached) : null;
}

/** Kept short — Twilio bills per 160-character segment. */
export function alertMessage(view: AdvertiserView, milestone: number): string {
  const who = `${view.business}${view.category ? ` (${view.category})` : ""}`;

  if (milestone < 0) {
    const days = Math.abs(view.daysRemaining);
    return `Mex Taco ads · ${who} term ENDED ${formatDate(view.endDate)}, ${days} days ago, still marked running. Renew or close it out: ${ADMIN_URL}`;
  }

  const when =
    view.daysRemaining === 0
      ? "ends TODAY"
      : `ends ${formatDate(view.endDate)} — ${view.daysRemaining} days`;
  const rate = view.monthly ? `$${view.monthly}/mo ${view.planName}. ` : "";

  return `Mex Taco ads · ${who} ${when}. ${rate}Renew or the category goes back on the market: ${ADMIN_URL}`;
}

/**
 * The advertiser hears from us three times, not eight. A heads-up with the
 * decision buttons, one reminder, and a last call — anything more reads as
 * pestering a paying customer. The overdue nags stay internal.
 */
export const ADVERTISER_EMAIL_POINTS = [30, 7, 0];

/** Email marker for the ledger, kept distinct from the team-text marker. */
const emailMarker = (milestone: number) => `e${milestone}`;

export type PendingNotice = {
  advertiser: AdvertiserView;
  milestone: number;
  message: string;
  /** The team text hasn't gone out for this threshold yet. */
  needsSms: boolean;
  /** The advertiser email is due, deliverable, and they haven't replied yet. */
  needsEmail: boolean;
};

/** Everything due right now that hasn't already gone out for this term. */
export async function findDueNotices(): Promise<PendingNotice[]> {
  const active = (await listAdvertisers()).filter((a) => a.status === "active");
  const canEmail = isEmailConfigured() && isLinkSigningConfigured();

  const notices = await Promise.all(
    active.map(async (advertiser) => {
      const milestone = milestoneFor(advertiser.daysRemaining);
      if (milestone === null) return null;

      const needsSms = !(await alreadySent(
        advertiser.id,
        advertiser.endDate,
        milestone,
      ));

      const emailEligible =
        canEmail &&
        Boolean(advertiser.email) &&
        ADVERTISER_EMAIL_POINTS.includes(milestone);

      // Someone who has already told us what they want shouldn't keep getting
      // asked; the team still gets its reminders.
      const needsEmail =
        emailEligible &&
        !(await alreadySent(
          advertiser.id,
          advertiser.endDate,
          emailMarker(milestone),
        )) &&
        !(await hasResponded(advertiser.id, advertiser.endDate));

      if (!needsSms && !needsEmail) return null;

      return {
        advertiser,
        milestone,
        message: alertMessage(advertiser, milestone),
        needsSms,
        needsEmail,
      };
    }),
  );

  return notices
    .filter((n): n is PendingNotice => n !== null)
    .sort((a, b) => a.advertiser.daysRemaining - b.advertiser.daysRemaining);
}

export type ScheduledNotice = {
  advertiser: AdvertiserView;
  /** The next threshold this advertiser will cross. */
  nextPoint: number;
  /** Days from now until it fires. */
  inDays: number;
};

/** What the watch will do next, so the team can see it's actually armed. */
export async function upcomingSchedule(): Promise<ScheduledNotice[]> {
  const active = (await listAdvertisers()).filter((a) => a.status === "active");
  return active
    .map((advertiser) => {
      const upcoming = NOTICE_POINTS.filter(
        (point) => point < advertiser.daysRemaining,
      );
      if (upcoming.length === 0) return null;
      const nextPoint = Math.max(...upcoming);
      return {
        advertiser,
        nextPoint,
        inDays: advertiser.daysRemaining - nextPoint,
      };
    })
    .filter((s): s is ScheduledNotice => s !== null)
    .sort((a, b) => a.inDays - b.inDays);
}

/**
 * The daily job. Safe to run twice — the ledger makes repeats no-ops — and safe
 * to run with nothing configured, which reports the misconfiguration instead of
 * pretending it sent.
 */
export async function runRenewalCheck(trigger: string): Promise<RunLogEntry> {
  const due = await findDueNotices();
  const notes: string[] = [];
  let sent = 0;
  let failed = 0;

  const canText = isAlertingConfigured();
  if (!canText) {
    notes.push(
      "Team texts are off — set TWILIO_* and ADS_ALERT_PHONES. Nothing was marked as sent.",
    );
  }
  if (!isEmailConfigured()) {
    notes.push("Advertiser email is off — set RESEND_API_KEY.");
  } else if (!isLinkSigningConfigured()) {
    notes.push("Advertiser email is off — set ADS_LINK_SECRET to sign reply links.");
  }

  for (const notice of due) {
    const { advertiser, milestone } = notice;

    if (notice.needsSms && canText) {
      const results = await sendTeamSms(notice.message);
      const delivered = results.filter((r) => r.ok).length;
      if (delivered > 0) {
        // Only burn the notice once it has actually reached somebody; a Twilio
        // outage should mean "try again tomorrow", not "warning lost".
        await markSent(advertiser.id, advertiser.endDate, milestone);
        sent += 1;
        notes.push(
          `${advertiser.business}: team texted (${delivered} recipient${delivered === 1 ? "" : "s"}).`,
        );
      } else {
        failed += 1;
        const why = results.find((r) => r.error)?.error ?? "unknown error";
        notes.push(`${advertiser.business}: text failed (${why}). Will retry.`);
      }
    }

    if (notice.needsEmail) {
      const result = await emailAdvertiser(advertiser);
      if (result.ok) {
        await markSent(advertiser.id, advertiser.endDate, emailMarker(milestone));
        sent += 1;
        notes.push(`${advertiser.business}: renewal email sent to ${advertiser.email}.`);
      } else {
        failed += 1;
        notes.push(
          `${advertiser.business}: email failed (${result.error ?? "unknown"}). Will retry.`,
        );
      }
    }
  }

  if (due.length === 0) notes.push("Nothing due today.");

  return logAndReturn({ trigger, checked: due.length, sent, failed, notes });
}

/**
 * Builds and sends one advertiser's renewal email. Their scan count goes in
 * when we have one — it is the most persuasive thing on the page, and it's the
 * number they're really asking about.
 */
async function emailAdvertiser(
  advertiser: AdvertiserView,
): Promise<{ ok: boolean; error?: string }> {
  const links = {
    renew: renewalUrl(advertiser.id, advertiser.endDate, "renew"),
    change: renewalUrl(advertiser.id, advertiser.endDate, "change"),
    cancel: renewalUrl(advertiser.id, advertiser.endDate, "cancel"),
  };
  if (!links.renew || !links.change || !links.cancel) {
    return { ok: false, error: "ADS_LINK_SECRET is not set" };
  }

  let scanTotal: number | undefined;
  if (advertiser.qrCode) {
    try {
      scanTotal = (await getCodeStats(advertiser.qrCode, 1)).total;
    } catch {
      scanTotal = undefined;
    }
  }

  const { subject, html, text } = renewalEmail(
    advertiser,
    { renew: links.renew, change: links.change, cancel: links.cancel },
    scanTotal,
  );

  return sendEmail({ to: advertiser.email, subject, html, text });
}

async function logAndReturn(
  partial: Omit<RunLogEntry, "at">,
): Promise<RunLogEntry> {
  const entry: RunLogEntry = { at: new Date().toISOString(), ...partial };
  await recordRun(entry);
  return entry;
}
