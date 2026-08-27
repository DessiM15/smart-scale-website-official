/**
 * The landing tab: the numbers, what needs a call today, and the state of the
 * automatic renewal watch.
 */

import { runAlertsAction, clearResponseAction } from "../actions";
import { SubmitButton } from "./submit-button";
import {
  alertRecipients,
  isAlertingConfigured,
  isSmsConfigured,
  type RunLogEntry,
} from "@/lib/ads/notify";
import { isEmailConfigured } from "@/lib/ads/email";
import type { BackupEntry } from "@/lib/ads/backup";
import type { Briefing } from "@/lib/ads/briefing";
import { tabHref } from "./types";
import { isLinkSigningConfigured } from "@/lib/ads/links";
import type { PendingNotice, ScheduledNotice } from "@/lib/ads/renewals";
import type { RenewalResponse } from "@/lib/ads/responses";
import {
  formatDate,
  PLAN_LIST,
  SELLABLE_SLOTS,
  type AdvertiserView,
  type Prospect,
  type RosterSummary,
} from "@/lib/ads/roster";
import {
  Card,
  Empty,
  Note,
  Pill,
  SubHead,
  Tile,
  btnSolid,
  linkQuiet,
  money,
  stamp,
  type Tone,
} from "./ui";

const NOTICE_LABEL =
  "30, 14, 7 and 3 days out, on the final day, then again if it lapses";

/** Last four digits only — enough to confirm the right phone, not a leak. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `···${digits.slice(-4)}` : phone;
}

/** Names a threshold — used for what's scheduled, not what's happening now. */
function noticeLabel(point: number): string {
  if (point > 0) return `${point}-day warning`;
  if (point === 0) return "final day";
  return `${Math.abs(point)} days overdue`;
}

/**
 * The advertiser's actual position, for the queue. The milestone that triggered
 * a notice is rarely the true number — something 15 days past its end date
 * trips the 7-day-overdue threshold, and reading "7 days overdue" there is
 * simply wrong.
 */
function currentStanding(daysRemaining: number): string {
  if (daysRemaining > 1) return `${daysRemaining} days left`;
  if (daysRemaining === 1) return "1 day left";
  if (daysRemaining === 0) return "ends today";
  return `${Math.abs(daysRemaining)} days overdue`;
}

const CHOICE_STYLE: Record<
  RenewalResponse["choice"],
  { label: string; tone: Tone }
> = {
  renew: { label: "Wants to renew", tone: "ok" },
  change: { label: "Wants to change package", tone: "warn" },
  cancel: { label: "Wants to end their run", tone: "bad" },
};

/* --------------------------------- pieces --------------------------------- */

/**
 * A renewal note, composed and handed to your own mail client.
 *
 * Not a substitute for the automatic emails — it sends from your address, not
 * the system's, and nothing records that it went. It exists because a term
 * running out does not wait for an integration to be fixed, and retyping the
 * same note for every advertiser is how outreach quietly stops happening.
 */
function outreachLink(v: AdvertiserView): string {
  const subject = v.overdue
    ? `Your ad at Mex Taco House has ended`
    : `Your ad at Mex Taco House ends ${formatDate(v.endDate)}`;

  const body = [
    `Hi${v.contactName ? ` ${v.contactName}` : ""},`,
    ``,
    `${v.business} has been running on the dining-room screens at Mex Taco House${
      v.category ? ` as our only ${v.category} advertiser` : ""
    }. Your ${v.planName} term ${v.overdue ? "ended" : "ends"} on ${formatDate(v.endDate)}.`,
    ``,
    `Renewing keeps your category locked. If the term lapses it goes back on the market, and another business in your category can take the spot.`,
    ``,
    `Would you like to keep it running?`,
    ``,
  ].join("\n");

  return `mailto:${encodeURIComponent(v.email)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

const pillAction =
  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors";

function NeedsAttention({
  items,
  emailArmed,
}: {
  items: AdvertiserView[];
  emailArmed: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <Card
      title="Needs attention"
      lede="Reach out before the term runs out — a lapsed category goes back on the market."
      surface="warn"
      className="mb-5"
    >
      {/* The automatic notices at 30, 7 and 0 days are the safety net under
          this list. With them off, this list is the only thing standing
          between a term and a lapsed category, so it says so. */}
      {!emailArmed && (
        <div className="mb-5">
          <Note tone="bad">
            <p className="text-sm font-semibold text-white">
              Advertiser emails aren&apos;t sending, so these are yours to make.
            </p>
            <p className="mt-1.5 text-sm text-white/55">
              Normally each of these would get an automatic notice at 30, 7 and 0
              days. Until email is connected, nothing goes out on its own — the
              Email button below opens a note already written, from your own
              mailbox.
            </p>
          </Note>
        </div>
      )}

      <ul className="divide-y divide-white/[0.06] -my-2">
        {items.map((v) => (
          <li key={v.id} className="flex flex-wrap items-start justify-between gap-3 py-3.5 text-sm">
            <span>
              <a
                href={`/advertise/admin/client/${v.id}`}
                className="font-semibold text-white hover:text-[#f87171] transition-colors"
              >
                {v.business}
              </a>
              <span className="text-white/35"> · {v.category || "no category"}</span>
              <span className="block text-xs text-white/35 mt-0.5">
                {[v.contactName, v.phone, v.email].filter(Boolean).join(" · ") ||
                  "no contact details on file"}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-3">
              <span
                className={`tabular-nums ${v.overdue ? "text-[#f87171] font-semibold" : v.daysRemaining <= 14 ? "text-amber-300" : "text-white/50"}`}
              >
                {v.overdue
                  ? `ended ${formatDate(v.endDate)} · ${Math.abs(v.daysRemaining)} days ago`
                  : `ends ${formatDate(v.endDate)} · ${v.daysRemaining} days`}
              </span>
              {v.phone && (
                <a
                  href={`tel:${v.phone.replace(/[^\d+]/g, "")}`}
                  className={`${pillAction} border-[#DC2626]/40 text-[#f87171] hover:bg-[#DC2626] hover:text-white hover:border-transparent`}
                >
                  Call
                </a>
              )}
              {v.email && (
                <a
                  href={outreachLink(v)}
                  className={`${pillAction} border-white/15 text-white/70 hover:text-white hover:border-white/40`}
                >
                  Email
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Replies({ replies }: { replies: RenewalResponse[] }) {
  if (replies.length === 0) return null;
  return (
    <div className="mb-6">
      <Note tone="bad">
        <p className="text-sm font-semibold text-white">
          Advertiser replies ({replies.length}) — action needed
        </p>
        <ul className="mt-4 space-y-4">
          {replies.map((r) => {
            const style = CHOICE_STYLE[r.choice];
            return (
              <li
                key={`${r.advertiserId}-${r.endDate}`}
                className="flex flex-wrap items-start justify-between gap-3"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-white">{r.business}</span>
                    <Pill tone={style.tone}>{style.label}</Pill>
                  </p>
                  <p className="text-xs text-white/40 mt-1.5">
                    Term ending {formatDate(r.endDate)}
                    {r.requestedPlan
                      ? ` · asked for ${PLAN_LIST.find((p) => p.id === r.requestedPlan)?.name ?? r.requestedPlan}`
                      : ""}
                    {" · "}
                    {stamp(r.at)}
                  </p>
                  {r.note && (
                    <p className="text-xs text-white/55 mt-1.5 italic">
                      &ldquo;{r.note}&rdquo;
                    </p>
                  )}
                </div>
                <form action={clearResponseAction}>
                  <input type="hidden" name="advertiserId" value={r.advertiserId} />
                  <input type="hidden" name="endDate" value={r.endDate} />
                  <button type="submit" className={linkQuiet}>
                    Mark handled
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-white/35">
          Replies are what the advertiser asked for, not a change to the rotation —
          update their record on the Advertisers tab once you&apos;ve spoken.
        </p>
      </Note>
    </div>
  );
}

function RenewalWatch({
  due,
  schedule,
  runs,
  replies,
}: {
  due: PendingNotice[];
  schedule: ScheduledNotice[];
  runs: RunLogEntry[];
  replies: RenewalResponse[];
}) {
  const armed = isAlertingConfigured();
  const recipients = alertRecipients();
  const lastRun = runs[0];
  const emailArmed = isEmailConfigured() && isLinkSigningConfigured();

  const missing: string[] = [];
  if (!isSmsConfigured())
    missing.push("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER");
  if (recipients.length === 0) missing.push("ADS_ALERT_PHONES");

  return (
    <Card
      title="Renewal watch"
      lede={`Checks every morning and texts the team as a term winds down — ${NOTICE_LABEL}.`}
      action={
        <form action={runAlertsAction}>
          <SubmitButton className={btnSolid} pendingLabel="Checking…">
            Run check now
          </SubmitButton>
        </form>
      }
    >
      <div className="flex flex-wrap items-center gap-3 text-sm mb-6">
        <Pill tone={armed ? "ok" : "bad"}>{armed ? "Armed" : "Not sending"}</Pill>
        {armed ? (
          <span className="text-white/45">
            Texting {recipients.map(maskPhone).join(", ")}
          </span>
        ) : (
          <span className="text-[#f87171]">
            Set {missing.join(" and ")} in Vercel, then redeploy.
          </span>
        )}
        <Pill
          tone={emailArmed ? "ok" : "neutral"}
          title={
            emailArmed
              ? "Advertisers get a renewal email at 30, 7 and 0 days"
              : "Set PLUNK_API_KEY and ADS_LINK_SECRET to email advertisers"
          }
        >
          {emailArmed ? "Emailing advertisers" : "Advertiser email off"}
        </Pill>
        {lastRun && (
          <span className="text-white/30 text-xs">
            Last checked {stamp(lastRun.at)} ({lastRun.trigger})
          </span>
        )}
      </div>

      <Replies replies={replies} />

      {due.length > 0 && (
        <div className="mb-6">
          <Note tone="warn">
            <p className="text-sm font-semibold text-white">
              Waiting to send ({due.length})
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {due.map((n) => (
                <li
                  key={`${n.advertiser.id}-${n.milestone}`}
                  className="text-sm text-white/55"
                >
                  <span className="font-semibold text-white">
                    {n.advertiser.business}
                  </span>{" "}
                  — {currentStanding(n.advertiser.daysRemaining)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-white/35">
              These go out on the next check. Run it now if you don&apos;t want to wait
              for the morning.
            </p>
          </Note>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <SubHead>Coming up</SubHead>
          {schedule.length === 0 ? (
            <p className="text-sm text-white/35">
              No notices scheduled — every active term is either past its last reminder
              or there are no advertisers yet.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {schedule.slice(0, 6).map((s) => (
                <li
                  key={s.advertiser.id}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="text-white/80">{s.advertiser.business}</span>
                  <span className="text-white/30 text-xs tabular-nums whitespace-nowrap">
                    {noticeLabel(s.nextPoint)} in {s.inDays}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <SubHead>Recent checks</SubHead>
          {runs.length === 0 ? (
            <p className="text-sm text-white/35">
              Hasn&apos;t run yet. Use &ldquo;Run check now&rdquo; to try it.
            </p>
          ) : (
            <ul className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
              {runs.map((run, i) => (
                <li key={`${run.at}-${i}`} className="text-xs">
                  <span className="text-white/55">{stamp(run.at)}</span>
                  <span className="text-white/30">
                    {" "}
                    · {run.sent} sent
                    {run.failed > 0 ? `, ${run.failed} failed` : ""}
                  </span>
                  {run.notes.length > 0 && (
                    <p className="text-white/30 mt-0.5">{run.notes[0]}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ---------------------------------- tab ----------------------------------- */

/**
 * What today is about, in two or three sentences.
 *
 * Every figure in it was computed here and checked against the draft before it
 * was allowed on screen — the model writes the prose, never the numbers. When
 * that check fails, or the key is missing, the same facts are stated plainly
 * instead. Either way what you read is true.
 */
function TodayBriefing({ briefing }: { briefing: Briefing }) {
  if (!briefing.text) return null;
  return (
    <div className="mb-5 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.05] to-transparent px-6 sm:px-8 py-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#DC2626] font-semibold">
        Today
      </p>
      <p className="mt-2.5 text-lg sm:text-xl text-white/90 leading-relaxed max-w-3xl">
        {briefing.text}
      </p>
      {briefing.rejectedReason && (
        <p className="mt-3 text-xs text-white/25">
          Written plainly rather than by the model — {briefing.rejectedReason}.
        </p>
      )}
    </div>
  );
}

/**
 * Clients on the screens with no countersigned agreement covering the term
 * they're actually running. Not a blocker — a spot often starts on a handshake
 * — but it is exactly the sort of thing that goes unnoticed for a year.
 */
function Unsigned({ items }: { items: AdvertiserView[] }) {
  if (items.length === 0) return null;
  return (
    <Card
      title="Running without signed paperwork"
      lede="Nothing is stopping these ads, but there's no agreement on file for the term they're in."
      surface="warn"
      className="mb-5"
    >
      <ul className="divide-y divide-white/[0.06] -my-2">
        {items.map((v) => (
          <li
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
          >
            <span>
              <a
                href={`/advertise/admin/client/${v.id}`}
                className="font-semibold text-white hover:text-[#f87171] transition-colors"
              >
                {v.business}
              </a>
              <span className="text-white/35"> · {v.category || "no category"}</span>
            </span>
            <a
              href={`/advertise/admin/client/${v.id}`}
              className="rounded-full border border-amber-400/40 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-400/10 transition-colors"
            >
              Prepare one
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Leads that came in on their own and haven't been picked up yet. The whole
 * point of the advertise page writing into the roster is that these stop
 * living in an inbox, so they belong on the front page, not two tabs away.
 */
function NewLeads({ leads }: { leads: Prospect[] }) {
  if (leads.length === 0) return null;
  return (
    <Card
      title={`New ${leads.length === 1 ? "lead" : "leads"} from the advertise page`}
      lede="Nobody has worked these yet. Marking one contacted or hot takes them off this list."
      surface="warn"
      className="mb-5"
      action={
        <a href={tabHref("prospects")} className={linkQuiet}>
          All prospects
        </a>
      }
    >
      <ul className="divide-y divide-white/[0.06] -my-2">
        {leads.map((lead) => (
          <li
            key={lead.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
          >
            <span>
              <span className="font-semibold text-white">{lead.business}</span>
              <span className="text-white/35">
                {" "}
                · {lead.category || "no category given"}
              </span>
            </span>
            <span className="flex items-center gap-4">
              <span className="text-white/40 text-xs">{stamp(lead.addedAt)}</span>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                  className="rounded-full border border-[#DC2626]/40 px-3 py-1 text-xs font-semibold text-[#f87171] hover:bg-[#DC2626] hover:text-white hover:border-transparent transition-colors"
                >
                  Call
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * The roster is the one thing here that can't be reconstructed from anything
 * else, so whether it's being copied somewhere safe belongs on the front page
 * rather than buried in a settings screen.
 */
function Backups({ entries }: { entries: BackupEntry[] }) {
  const last = entries[0];
  if (last) {
    const stale = Date.now() - Date.parse(last.at) > 3 * 86_400_000;
    if (!stale) return null;
    return (
      <div className="mb-5">
        <Note tone="warn">
          <p className="text-sm font-semibold text-white">
            The roster hasn&apos;t been backed up since {stamp(last.at)}.
          </p>
          <p className="mt-1.5 text-sm text-white/55">
            The daily job should be copying it every night. Check that the cron ran.
          </p>
        </Note>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <Note tone="warn">
        <p className="text-sm font-semibold text-white">
          The roster isn&apos;t being backed up.
        </p>
        <p className="mt-1.5 text-sm text-white/55">
          Contracts and rates live in one database on a free plan with no copy
          anywhere else. In Vercel: Storage → Create → Blob, connect it to this
          project, then redeploy — the nightly job takes it from there.
        </p>
      </Note>
    </div>
  );
}

export function OverviewTab({
  summary,
  needsAttention,
  due,
  schedule,
  runs,
  replies,
  backups,
  newLeads,
  briefing,
}: {
  summary: RosterSummary;
  needsAttention: AdvertiserView[];
  due: PendingNotice[];
  schedule: ScheduledNotice[];
  runs: RunLogEntry[];
  replies: RenewalResponse[];
  backups: BackupEntry[];
  newLeads: Prospect[];
  briefing: Briefing;
}) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Tile
          label="Running now"
          value={`${summary.active}`}
          hint={summary.pending ? `+${summary.pending} signed, not live` : "of 16 slots"}
        />
        <Tile
          label="Open slots"
          value={`${summary.openSlots}`}
          hint={`${SELLABLE_SLOTS} sellable in the rotation`}
          tone={summary.openSlots > 0 ? "alert" : "plain"}
        />
        <Tile
          label="Monthly revenue"
          value={money(summary.monthlyRevenue)}
          hint={
            summary.customDeals > 0
              ? `${money(summary.listMonthlyRevenue)} at list · ${summary.customDeals} custom deal${
                  summary.customDeals === 1 ? "" : "s"
                }`
              : "active advertisers"
          }
        />
        <Tile
          label="Contracted"
          value={money(summary.contractedRemaining)}
          hint="left to invoice on current terms"
        />
      </div>

      <TodayBriefing briefing={briefing} />

      <NeedsAttention
        items={needsAttention}
        emailArmed={isEmailConfigured() && isLinkSigningConfigured()}
      />

      <NewLeads leads={newLeads} />

      <Unsigned items={summary.unsigned} />

      <Backups entries={backups} />

      {needsAttention.length === 0 &&
        replies.length === 0 &&
        due.length === 0 &&
        newLeads.length === 0 &&
        summary.unsigned.length === 0 && (
        <div className="mb-5">
          <Empty>
            Nothing needs you today — no terms winding down, no replies waiting.
          </Empty>
        </div>
      )}

      <RenewalWatch due={due} schedule={schedule} runs={runs} replies={replies} />
    </>
  );
}
