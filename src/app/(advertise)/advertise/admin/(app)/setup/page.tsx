import type { Metadata } from "next";
import { runAlertsAction } from "../../actions";
import { recentBackups } from "@/lib/ads/backup";
import { isArtworkStoreConfigured } from "@/lib/ads/artwork";
import { isEmailConfigured } from "@/lib/ads/email";
import { isLinkSigningConfigured } from "@/lib/ads/links";
import { alertRecipients, isAlertingConfigured, isSmsConfigured, recentRuns } from "@/lib/ads/notify";
import { findDueNotices, upcomingSchedule } from "@/lib/ads/renewals";
import { setupItems, setupProgress } from "@/lib/ads/setup";
import { PageHeader } from "../../_components/shell";
import { SetupTab } from "../../_components/setup";
import { SubmitButton } from "../../_components/submit-button";
import { Badge, Card, Note, SubHead, btnPrimary, stamp } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Setup" };

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `···${digits.slice(-4)}` : phone;
}

function noticeLabel(point: number): string {
  if (point > 0) return `${point}-day warning`;
  if (point === 0) return "final day";
  return `${Math.abs(point)} days overdue`;
}

function standing(daysRemaining: number): string {
  if (daysRemaining > 1) return `${daysRemaining} days left`;
  if (daysRemaining === 1) return "1 day left";
  if (daysRemaining === 0) return "ends today";
  return `${Math.abs(daysRemaining)} days overdue`;
}

/** The automatic renewal watch: armed or not, what is queued, what ran. */
async function RenewalWatch() {
  const [due, schedule, runs] = await Promise.all([findDueNotices(), upcomingSchedule(), recentRuns()]);
  const armed = isAlertingConfigured();
  const recipients = alertRecipients();
  const lastRun = runs[0];
  const emailArmed = isEmailConfigured() && isLinkSigningConfigured();
  const missing: string[] = [];
  if (!isSmsConfigured()) missing.push("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER");
  if (recipients.length === 0) missing.push("ADS_ALERT_PHONES");

  return (
    <Card
      id="renewal-watch"
      title="Renewal watch"
      lede="Checks every morning and texts the team as a term winds down: 30, 14, 7 and 3 days out, on the final day, then again if it lapses. Advertisers get an email at 30, 7 and 0."
      action={
        <form action={runAlertsAction}>
          <input type="hidden" name="returnTo" value="/advertise/admin/setup" />
          <SubmitButton className={btnPrimary} pendingLabel="Checking">
            Run check now
          </SubmitButton>
        </form>
      }
      className="mb-5"
    >
      <div className="flex flex-wrap items-center gap-3 text-sm mb-6">
        <Badge tone={armed ? "ok" : "bad"}>{armed ? "Texting the team" : "Not texting"}</Badge>
        {armed ? (
          <span className="text-white/45 text-xs">to {recipients.map(maskPhone).join(", ")}</span>
        ) : (
          <span className="text-[#f87171] text-xs">Set {missing.join(" and ")} in Vercel, then redeploy.</span>
        )}
        <Badge tone={emailArmed ? "ok" : "neutral"}>{emailArmed ? "Emailing advertisers" : "Advertiser email off"}</Badge>
        {lastRun && <span className="text-white/30 text-xs">Last checked {stamp(lastRun.at)} ({lastRun.trigger})</span>}
      </div>

      {due.length > 0 && (
        <div className="mb-6">
          <Note tone="warn">
            <p className="text-sm text-white">Waiting to send ({due.length})</p>
            <ul className="mt-2 flex flex-col gap-1">
              {due.map((n) => (
                <li key={`${n.advertiser.id}-${n.milestone}`} className="text-sm text-white/55">
                  <span className="text-white">{n.advertiser.business}</span>: {standing(n.advertiser.daysRemaining)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-white/35">These go out on the next check. Run it now if you don&apos;t want to wait for the morning.</p>
          </Note>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <SubHead>Coming up</SubHead>
          {schedule.length === 0 ? (
            <p className="text-sm text-white/35">No notices scheduled.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {schedule.slice(0, 6).map((s) => (
                <li key={s.advertiser.id} className="flex items-baseline justify-between gap-3 text-sm">
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
            <p className="text-sm text-white/35">Hasn&apos;t run yet. Use &ldquo;Run check now&rdquo; to try it.</p>
          ) : (
            <ul className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
              {runs.map((run, i) => (
                <li key={`${run.at}-${i}`} className="text-xs">
                  <span className="text-white/55">{stamp(run.at)}</span>
                  <span className="text-white/30">
                    {" "}· {run.sent} sent{run.failed > 0 ? `, ${run.failed} failed` : ""}
                  </span>
                  {run.notes.length > 0 && <p className="text-white/30 mt-0.5">{run.notes[0]}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string; sent?: string; checked?: string }>;
}) {
  const [params, backups] = await Promise.all([searchParams, recentBackups()]);
  const items = setupItems();
  const { on, total } = setupProgress(items);

  return (
    <Shell active="setup" banner={params}>
      <PageHeader eyebrow={`Setup · ${on} of ${total} switched on`} title="What's connected, and what isn't." />
      <RenewalWatch />
      <SetupTab
        items={items}
        backups={backups}
        emailConfigured={isEmailConfigured()}
        storageConfigured={isArtworkStoreConfigured()}
        result={{ msg: params.msg, err: params.err, detail: params.detail, sent: params.sent }}
      />
    </Shell>
  );
}
