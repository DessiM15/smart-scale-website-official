/**
 * The two follow-up emails after a website check: day 3 and day 10.
 *
 * Run once a day by `/api/wb/cron`. A lead gets each message once, and only
 * while all of this is true:
 *
 *   - the check finished and found at least one problem
 *   - the report email really went out (a held report is never followed up)
 *   - the lead is still "scanned": a fix request or a no-website request
 *     makes it hot, and Contacted, Won and Lost are set by hand. Any of
 *     those stops the follow-ups for good
 *   - the lead has not unsubscribed (`sendToOwner` checks, as it does the
 *     postal address)
 *
 * A booking made on the calendar link cannot be seen from here. Marking the
 * lead Contacted is what stops the emails for someone who booked.
 *
 * Each message has a window, not a single day, so a missed run or an
 * address saved late still sends it, but never weeks late.
 */

import { followUpOneEmail, followUpTwoEmail, reportUrl, sendToOwner, type OwnerEmailKind } from "./email";
import { getReport, listEvents, listLeads, type Lead } from "./store";

const DAY_MS = 24 * 60 * 60 * 1000;

type Step = { kind: Extract<OwnerEmailKind, "follow-up-1" | "follow-up-2">; fromDay: number; untilDay: number };

/** Days are counted from the moment the report email was sent. */
const STEPS: Step[] = [
  { kind: "follow-up-1", fromDay: 3, untilDay: 7 },
  { kind: "follow-up-2", fromDay: 10, untilDay: 17 },
];

export type FollowUpResult = {
  leadId: string;
  site: string;
  kind: Step["kind"];
  /** sent, held, unsubscribed, already, failed, or would-send on a dry run. */
  outcome: string;
};

export type FollowUpRun = { checked: number; results: FollowUpResult[] };

function eligible(lead: Lead): boolean {
  return lead.status === "scanned" && Boolean(lead.email) && !lead.emailOptOut && lead.scan?.state === "completed" && Boolean(lead.scan.reportId) && (lead.scan.problems ?? 0) > 0;
}

/**
 * Sends whatever is due. `now` and `dry` exist so the schedule can be tried
 * without waiting ten days or sending anything.
 */
export async function runFollowUps(options: { now?: Date; dry?: boolean } = {}): Promise<FollowUpRun> {
  const now = (options.now ?? new Date()).getTime();
  const leads = (await listLeads()).filter(eligible);
  const results: FollowUpResult[] = [];

  for (const lead of leads) {
    const events = await listEvents(lead.id);
    const sent = (kind: string) => events.filter((e) => e.type === "email_sent" && e.detail === kind);
    // The newest report email is the start of the clock.
    const report = sent("report").sort((a, b) => b.at.localeCompare(a.at))[0];
    if (!report) continue;
    const days = (now - Date.parse(report.at)) / DAY_MS;

    for (const step of STEPS) {
      if (days < step.fromDay || days >= step.untilDay || sent(step.kind).length > 0) continue;
      const stored = await getReport(lead.scan!.reportId!);
      if (!stored) continue;
      const site = stored.report.base.replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (options.dry) {
        results.push({ leadId: lead.id, site, kind: step.kind, outcome: "would-send" });
        continue;
      }
      const links = { report: reportUrl(stored.reportId) };
      const build = step.kind === "follow-up-1" ? followUpOneEmail : followUpTwoEmail;
      const outcome = await sendToOwner(lead, step.kind, (footer) => build(stored.report, links, footer));
      results.push({ leadId: lead.id, site, kind: step.kind, outcome: outcome.sent ? "sent" : (outcome.reason ?? "failed") });
    }
  }
  return { checked: leads.length, results };
}
