import type { Metadata } from "next";
import { isAdminConfigured, isSignedIn } from "@/lib/ads/auth";
import { isRedisConfigured, isRedisReachable } from "@/lib/ads/redis";
import { listLinks, type AdLinkRecord } from "@/lib/ads/link-store";
import { getCodeStats } from "@/lib/ads/scan-store";
import {
  formatDate,
  listAdvertisers,
  listProspects,
  summarize,
  today,
  PLAN_LIST,
  SELLABLE_SLOTS,
  type AdvertiserView,
  type Prospect,
} from "@/lib/ads/roster";
import {
  alertRecipients,
  isAlertingConfigured,
  isSmsConfigured,
  recentRuns,
  type RunLogEntry,
} from "@/lib/ads/notify";
import {
  findDueNotices,
  upcomingSchedule,
  type PendingNotice,
  type ScheduledNotice,
} from "@/lib/ads/renewals";
import { isEmailConfigured } from "@/lib/ads/email";
import { isLinkSigningConfigured } from "@/lib/ads/links";
import { listResponses, type RenewalResponse } from "@/lib/ads/responses";
import { listReports, type MonthlyReport } from "@/lib/ads/reports";
import { isNarrativeConfigured } from "@/lib/ads/narrative";
import {
  clearResponseAction,
  deleteAdvertiserAction,
  editReportAction,
  generateReportsAction,
  saveLinkAction,
  sendReportAction,
  skipReportAction,
  toggleLinkActiveAction,
  deleteProspectAction,
  runAlertsAction,
  saveAdvertiserAction,
  saveProspectAction,
  signInAction,
  signOutAction,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ad Tracker",
  robots: { index: false, follow: false },
};

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const STATUS_LABEL = {
  active: "Running",
  pending: "Signed, not live",
  ended: "Ended",
} as const;

const PROSPECT_LABEL = {
  hot: "Hot",
  contacted: "Contacted",
  new: "New",
  passed: "Passed",
} as const;

/* ------------------------------- primitives ------------------------------- */

const inputClass =
  "w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2 text-sm text-[#1a1210] placeholder:text-[#b3a698] focus:outline-none focus:border-[#DC2626]";
const labelClass =
  "block text-[11px] uppercase tracking-[0.12em] text-[#9a8b7d] font-semibold mb-1.5";

function Field({
  label,
  name,
  // Two forms on this page share field names, so ids must be scoped or the
  // waitlist labels focus the advertiser form's inputs.
  id = name,
  defaultValue,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  id?: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
        {required && <span className="text-[#DC2626]"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={inputClass}
      />
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  tone = "plain",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "plain" | "alert";
}) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 border ${
        tone === "alert"
          ? "bg-[#fdf6e6] border-[#f0c674]"
          : "bg-white border-black/[0.06]"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#9a8b7d] font-semibold">
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-semibold text-[#1a1210] tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[#9a8b7d]">{hint}</p>}
    </div>
  );
}

function Banner({
  msg,
  err,
  clash,
  sent,
  checked,
  detail,
}: {
  msg?: string;
  err?: string;
  clash?: string;
  sent?: string;
  checked?: string;
  detail?: string;
}) {
  const notices: Record<string, string> = {
    added: "Advertiser added.",
    updated: "Changes saved.",
    removed: "Advertiser removed.",
    prospect: "Saved to the interested list.",
    prospectRemoved: "Removed from the interested list.",
    replyCleared: "Reply cleared.",
    linkAdded: "QR code created — download the artwork below.",
    linkSaved: "QR code updated.",
    linkOn: "QR code switched back on.",
    linkOff: "QR code retired. Scans now land on the advertise page.",
    reportsDrafted:
      Number(sent ?? 0) === 0
        ? "No new reports to draft."
        : `Drafted ${sent} report${sent === "1" ? "" : "s"} for review.`,
    reportSent: "Report sent.",
    reportSkipped: "Report skipped — it won't be sent.",
    reportEdited: "Report wording updated.",
    alerts:
      Number(checked ?? 0) === 0
        ? "Renewal check ran — nothing due today."
        : `Renewal check ran — ${sent ?? 0} of ${checked} notice${checked === "1" ? "" : "s"} sent.`,
  };
  const errors: Record<string, string> = {
    badkey: "That access key didn't work.",
    business: "Business name is required.",
    plan: "Pick a package.",
    startdate: "Start date is required.",
    category: `${clash ?? "Another advertiser"} already owns that category. End their run first, or use a different category.`,
    save: "Could not write to the database. Check that Upstash is connected, then try again.",
    missing: "Nothing to remove.",
    code: detail ?? "That code isn't valid.",
    destination: detail ?? "That web address isn't valid.",
    codetaken: `"${detail}" is already in use. Codes can never be reassigned — pick a different one.`,
    codemissing: `There's no QR code named "${detail}".`,
    logotype: "Logos must be a PNG, JPEG, WebP or SVG.",
    logosize: "That logo is over 200KB. Export a smaller version and try again.",
    reportsend: detail ?? "Could not send that report.",
  };

  const text = err ? errors[err] : msg ? notices[msg] : undefined;
  if (!text) return null;

  return (
    <div
      role="status"
      className={`rounded-2xl px-5 py-3.5 mb-6 text-sm border ${
        err
          ? "bg-[#fdecec] border-[#DC2626]/30 text-[#8f1d1d]"
          : "bg-[#eef7ee] border-green-600/20 text-[#1f5130]"
      }`}
    >
      {text}
    </div>
  );
}

/* ------------------------------- lock screen ------------------------------ */

function LockScreen({ configured, wrong }: { configured: boolean; wrong: boolean }) {
  return (
    <main className="min-h-screen bg-[#faf6f0] flex items-center justify-center px-6">
      <form
        action={signInAction}
        className="w-full max-w-sm rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-8"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#DC2626] font-semibold">
          Mex Taco House
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#1a1210]">Ad Tracker</h1>
        {configured ? (
          <>
            <p className="mt-2 text-sm text-[#7a6a5d]">
              Enter the access key to manage advertisers.
            </p>
            <input
              type="password"
              name="key"
              autoFocus
              placeholder="Access key"
              className="mt-6 w-full rounded-xl border border-black/[0.1] bg-[#faf6f0] px-4 py-3 text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:border-[#DC2626]"
            />
            {wrong && (
              <p className="mt-2 text-xs text-[#DC2626]">That key didn&apos;t work.</p>
            )}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-[#DC2626] text-white font-semibold py-3 hover:bg-[#b91c1c] transition-colors"
            >
              Sign in
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-[#5c4f45]">
            Set <code className="font-mono text-xs">ADS_ADMIN_KEY</code> in the Vercel
            project settings and redeploy to switch this page on.
          </p>
        )}
      </form>
    </main>
  );
}

/* --------------------------------- roster --------------------------------- */

function StatusPill({ view }: { view: AdvertiserView }) {
  const tone =
    view.overdue
      ? "bg-[#DC2626] text-white"
      : view.expiringSoon
        ? "bg-[#f0c674] text-[#1a1210]"
        : view.status === "active"
          ? "bg-[#eef7ee] text-[#1f5130]"
          : view.status === "pending"
            ? "bg-[#f3efe8] text-[#7a6a5d]"
            : "bg-black/[0.05] text-[#9a8b7d]";
  const label = view.overdue
    ? "Term ended"
    : view.expiringSoon
      ? `${view.daysRemaining}d left`
      : STATUS_LABEL[view.status];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}

function RosterRow({ view, knownCodes }: { view: AdvertiserView; knownCodes: Set<string> }) {
  const qrMissing = Boolean(view.qrCode) && !knownCodes.has(view.qrCode);
  return (
    <tr className="border-t border-black/[0.06] align-top">
      <td className="px-4 py-3">
        <p className="font-semibold text-[#1a1210]">{view.business}</p>
        {view.contactName && (
          <p className="text-xs text-[#9a8b7d]">{view.contactName}</p>
        )}
        {(view.email || view.phone) && (
          <p className="text-xs text-[#9a8b7d]">
            {[view.email, view.phone].filter(Boolean).join(" · ")}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-[#5c4f45]">{view.category || "—"}</td>
      <td className="px-4 py-3">
        <p className="text-[#5c4f45]">{view.planName}</p>
        <p className="text-xs text-[#9a8b7d] tabular-nums">
          {view.monthly ? `${money(view.monthly)}/mo` : "no charge"}
        </p>
      </td>
      <td className="px-4 py-3 text-[#5c4f45] whitespace-nowrap">
        {formatDate(view.startDate)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-[#5c4f45]">{formatDate(view.endDate)}</p>
        {view.status === "active" && (
          <p className="text-xs text-[#9a8b7d] tabular-nums">
            {view.daysRemaining >= 0
              ? `${view.daysRemaining} days`
              : `${Math.abs(view.daysRemaining)} days ago`}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusPill view={view} />
      </td>
      <td className="px-4 py-3">
        {view.qrCode ? (
          <>
            <span className="font-mono text-xs text-[#DC2626]">/go/{view.qrCode}</span>
            {qrMissing && (
              <p className="text-xs text-[#DC2626] mt-0.5">not in the link registry</p>
            )}
          </>
        ) : (
          <span className="text-xs text-[#b3a698]">none</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <a
          href={`/advertise/admin?edit=${encodeURIComponent(view.id)}#editor`}
          className="text-xs font-semibold text-[#DC2626] hover:underline"
        >
          Edit
        </a>
        <form action={deleteAdvertiserAction} className="inline">
          <input type="hidden" name="id" value={view.id} />
          <button
            type="submit"
            className="ml-3 text-xs text-[#9a8b7d] hover:text-[#DC2626]"
          >
            Remove
          </button>
        </form>
      </td>
    </tr>
  );
}

function AdvertiserForm({
  editing,
  codes,
}: {
  editing?: AdvertiserView;
  codes: LinkView[];
}) {
  return (
    <section
      id="editor"
      className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#1a1210]">
          {editing ? `Edit ${editing.business}` : "Add an advertiser"}
        </h2>
        {editing && (
          <a href="/advertise/admin" className="text-xs text-[#9a8b7d] hover:text-[#1a1210]">
            Cancel
          </a>
        )}
      </div>

      <form action={saveAdvertiserAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Business" name="business" defaultValue={editing?.business} required />
          <Field
            label="Category (locked)"
            name="category"
            defaultValue={editing?.category}
            placeholder="Plumbing, Dentistry, Auto Repair…"
          />
          <Field label="Contact name" name="contactName" defaultValue={editing?.contactName} />
          <Field label="Phone" name="phone" type="tel" defaultValue={editing?.phone} />
          <Field label="Email" name="email" type="email" defaultValue={editing?.email} />
          <div>
            <label className={labelClass} htmlFor="qrCode">
              QR code
            </label>
            <select
              id="qrCode"
              name="qrCode"
              defaultValue={editing?.qrCode ?? ""}
              className={inputClass}
            >
              <option value="">— none —</option>
              {codes.map((link) => (
                <option key={link.code} value={link.code}>
                  /go/{link.code} — {link.label}
                  {link.active ? "" : " (retired)"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[#9a8b7d]">
              Create codes in the QR codes section above.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="plan">
              Package <span className="text-[#DC2626]">*</span>
            </label>
            <select
              id="plan"
              name="plan"
              defaultValue={editing?.plan ?? "standard"}
              className={inputClass}
            >
              {PLAN_LIST.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {plan.months} mo
                  {plan.monthly ? ` · ${money(plan.monthly)}/mo` : " · no charge"}
                  {plan.internalOnly ? " (internal)" : ""}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Start date"
            name="startDate"
            type="date"
            defaultValue={editing?.startDate ?? today()}
            required
          />
          <div>
            <label className={labelClass} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={editing?.status ?? "active"}
              className={inputClass}
            >
              <option value="active">Running</option>
              <option value="pending">Signed, not live yet</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={editing?.notes}
            placeholder="Artwork due, renewal conversation, billing quirks…"
            className={inputClass}
          />
        </div>

        <p className="text-xs text-[#9a8b7d]">
          The end date is calculated from the package term — {editing ? "currently " : ""}
          {editing ? formatDate(editing.endDate) : "no need to enter it"}.
        </p>

        <button
          type="submit"
          className="rounded-xl bg-[#DC2626] text-white font-semibold px-6 py-3 hover:bg-[#b91c1c] transition-colors"
        >
          {editing ? "Save changes" : "Add advertiser"}
        </button>
      </form>
    </section>
  );
}

/* -------------------------------- waitlist -------------------------------- */

function ProspectList({ prospects }: { prospects: Prospect[] }) {
  if (prospects.length === 0) {
    return (
      <p className="text-sm text-[#9a8b7d]">
        Nobody on the list yet. Add businesses that ask about the screens — when a
        category opens up, this is who you call.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-black/[0.06]">
      {prospects.map((p) => (
        <li key={p.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-[#1a1210]">
              {p.business}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  p.status === "hot"
                    ? "bg-[#DC2626] text-white"
                    : p.status === "contacted"
                      ? "bg-[#f0c674] text-[#1a1210]"
                      : p.status === "passed"
                        ? "bg-black/[0.05] text-[#9a8b7d]"
                        : "bg-[#f3efe8] text-[#7a6a5d]"
                }`}
              >
                {PROSPECT_LABEL[p.status]}
              </span>
            </p>
            <p className="text-xs text-[#9a8b7d]">
              {[p.category, p.contactName, p.phone, p.email, p.source]
                .filter(Boolean)
                .join(" · ") || "no details"}
            </p>
            {p.notes && <p className="text-xs text-[#5c4f45] mt-1">{p.notes}</p>}
          </div>
          <form action={deleteProspectAction}>
            <input type="hidden" name="id" value={p.id} />
            <button type="submit" className="text-xs text-[#9a8b7d] hover:text-[#DC2626]">
              Remove
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}


/* ------------------------------ renewal watch ----------------------------- */

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

const CHOICE_STYLE = {
  renew: { label: "Wants to renew", tone: "bg-[#eef7ee] text-[#1f5130]" },
  change: { label: "Wants to change package", tone: "bg-[#fdf6e6] text-[#8a6d1f]" },
  cancel: { label: "Wants to end their run", tone: "bg-[#fdecec] text-[#8f1d1d]" },
} as const;

function Replies({ replies }: { replies: RenewalResponse[] }) {
  if (replies.length === 0) return null;
  return (
    <div className="mt-6 rounded-2xl border border-[#DC2626]/25 bg-[#fdf6f6] px-5 py-4">
      <p className="text-sm font-semibold text-[#1a1210]">
        Advertiser replies ({replies.length}) — action needed
      </p>
      <ul className="mt-3 space-y-3">
        {replies.map((r) => {
          const style = CHOICE_STYLE[r.choice];
          return (
            <li
              key={`${r.advertiserId}-${r.endDate}`}
              className="flex flex-wrap items-start justify-between gap-3"
            >
              <div>
                <p className="text-sm">
                  <span className="font-semibold text-[#1a1210]">{r.business}</span>{" "}
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.tone}`}
                  >
                    {style.label}
                  </span>
                </p>
                <p className="text-xs text-[#7a6a5d] mt-0.5">
                  Term ending {formatDate(r.endDate)}
                  {r.requestedPlan ? ` · asked for ${PLAN_LIST.find((p) => p.id === r.requestedPlan)?.name ?? r.requestedPlan}` : ""}
                  {" · "}
                  {new Intl.DateTimeFormat("en-US", {
                    timeZone: "America/Chicago",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(r.at))}
                </p>
                {r.note && (
                  <p className="text-xs text-[#5c4f45] mt-1 italic">&ldquo;{r.note}&rdquo;</p>
                )}
              </div>
              <form action={clearResponseAction}>
                <input type="hidden" name="advertiserId" value={r.advertiserId} />
                <input type="hidden" name="endDate" value={r.endDate} />
                <button
                  type="submit"
                  className="text-xs font-semibold text-[#7a6a5d] hover:text-[#DC2626]"
                >
                  Mark handled
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-[#7a6a5d]">
        Replies are what the advertiser asked for, not a change to the rotation —
        update their record above once you&apos;ve spoken.
      </p>
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
  if (!isSmsConfigured()) missing.push("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER");
  if (recipients.length === 0) missing.push("ADS_ALERT_PHONES");

  return (
    <section className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1210]">Renewal watch</h2>
          <p className="mt-1 text-sm text-[#7a6a5d]">
            Checks every morning and texts the team as a term winds down —
            {" "}
            {NOTICE_LABEL}.
          </p>
        </div>
        <form action={runAlertsAction}>
          <button
            type="submit"
            className="rounded-xl bg-[#1a1210] text-white text-sm font-semibold px-5 py-2.5 hover:bg-black transition-colors"
          >
            Run check now
          </button>
        </form>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            armed ? "bg-[#eef7ee] text-[#1f5130]" : "bg-[#fdecec] text-[#8f1d1d]"
          }`}
        >
          {armed ? "Armed" : "Not sending"}
        </span>
        {armed ? (
          <span className="text-[#7a6a5d]">
            Texting {recipients.map(maskPhone).join(", ")}
          </span>
        ) : (
          <span className="text-[#8f1d1d]">
            Set {missing.join(" and ")} in Vercel, then redeploy.
          </span>
        )}
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            emailArmed ? "bg-[#eef7ee] text-[#1f5130]" : "bg-[#f3efe8] text-[#7a6a5d]"
          }`}
          title={
            emailArmed
              ? "Advertisers get a renewal email at 30, 7 and 0 days"
              : "Set RESEND_API_KEY and ADS_LINK_SECRET to email advertisers"
          }
        >
          {emailArmed ? "Emailing advertisers" : "Advertiser email off"}
        </span>
        {lastRun && (
          <span className="text-[#9a8b7d]">
            Last checked{" "}
            {new Intl.DateTimeFormat("en-US", {
              timeZone: "America/Chicago",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(lastRun.at))}{" "}
            ({lastRun.trigger})
          </span>
        )}
      </div>

      <Replies replies={replies} />

      {due.length > 0 && (
        <div className="mt-6 rounded-2xl bg-[#fdf6e6] border border-[#f0c674] px-5 py-4">
          <p className="text-sm font-semibold text-[#1a1210]">
            Waiting to send ({due.length})
          </p>
          <ul className="mt-2 space-y-1.5">
            {due.map((n) => (
              <li key={`${n.advertiser.id}-${n.milestone}`} className="text-sm text-[#5c4f45]">
                <span className="font-semibold text-[#1a1210]">
                  {n.advertiser.business}
                </span>{" "}
                — {currentStanding(n.advertiser.daysRemaining)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[#7a6a5d]">
            These go out on the next check. Run it now if you don&apos;t want to wait
            for the morning.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <div>
          <p className={labelClass}>Coming up</p>
          {schedule.length === 0 ? (
            <p className="text-sm text-[#9a8b7d]">
              No notices scheduled — every active term is either past its last
              reminder or there are no advertisers yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {schedule.slice(0, 6).map((s) => (
                <li
                  key={s.advertiser.id}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="text-[#1a1210]">{s.advertiser.business}</span>
                  <span className="text-[#9a8b7d] text-xs tabular-nums whitespace-nowrap">
                    {noticeLabel(s.nextPoint)} in {s.inDays}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className={labelClass}>Recent checks</p>
          {runs.length === 0 ? (
            <p className="text-sm text-[#9a8b7d]">
              Hasn&apos;t run yet. Use &ldquo;Run check now&rdquo; to try it.
            </p>
          ) : (
            <ul className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {runs.map((run, i) => (
                <li key={`${run.at}-${i}`} className="text-xs">
                  <span className="text-[#5c4f45]">
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: "America/Chicago",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(run.at))}
                  </span>
                  <span className="text-[#9a8b7d]">
                    {" "}
                    · {run.sent} sent
                    {run.failed > 0 ? `, ${run.failed} failed` : ""}
                  </span>
                  {run.notes.length > 0 && (
                    <p className="text-[#9a8b7d] mt-0.5">{run.notes[0]}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}



/* -------------------------------- QR codes -------------------------------- */

type LinkView = AdLinkRecord & { scans: number };

function QrCodes({
  links,
  editing,
}: {
  links: LinkView[];
  editing?: LinkView;
}) {
  return (
    <section
      id="qr"
      className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8 mb-6"
    >
      <h2 className="text-lg font-semibold text-[#1a1210]">QR codes</h2>
      <p className="mt-1 mb-6 text-sm text-[#7a6a5d]">
        Each code is a short link on our own domain that counts the scan, then
        forwards to the advertiser. Because we own the link, you can change where
        an ad points long after the artwork is printed.
      </p>

      {links.length > 0 && (
        <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8 mb-8">
          <table className="w-full text-sm min-w-[48rem]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#9a8b7d]">
                <th className="px-4 py-2 font-semibold">Code</th>
                <th className="px-4 py-2 font-semibold">Sends people to</th>
                <th className="px-4 py-2 font-semibold text-right">Scans</th>
                <th className="px-4 py-2 font-semibold">Artwork</th>
                <th className="px-4 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.code} className="border-t border-black/[0.06] align-top">
                  <td className="px-4 py-3">
                    <p className="font-mono text-[#DC2626]">/go/{link.code}</p>
                    <p className="text-xs text-[#9a8b7d]">{link.label}</p>
                    {!link.active && (
                      <span className="inline-block mt-1 rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-semibold text-[#9a8b7d]">
                        Retired
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[#5c4f45] break-all">
                      {link.destination.replace(/^https?:\/\//, "")}
                    </p>
                    {link.logoDataUri && (
                      <p className="text-xs text-[#9a8b7d] mt-0.5">logo in the middle</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#1a1210]">
                    {link.scans.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`/api/ads/qr/${link.code}?format=svg`}
                      className="text-xs font-semibold text-[#DC2626] hover:underline"
                    >
                      SVG
                    </a>
                    <a
                      href={`/api/ads/qr/${link.code}?format=png`}
                      className="ml-3 text-xs font-semibold text-[#DC2626] hover:underline"
                    >
                      PNG
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`/advertise/admin?editLink=${encodeURIComponent(link.code)}#qr`}
                      className="text-xs font-semibold text-[#7a6a5d] hover:text-[#1a1210]"
                    >
                      Edit
                    </a>
                    <form action={toggleLinkActiveAction} className="inline">
                      <input type="hidden" name="code" value={link.code} />
                      <input type="hidden" name="active" value={link.active ? "0" : "1"} />
                      <button
                        type="submit"
                        className="ml-3 text-xs text-[#9a8b7d] hover:text-[#DC2626]"
                      >
                        {link.active ? "Retire" : "Restore"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        action={saveLinkAction}
        encType="multipart/form-data"
        className="border-t border-black/[0.06] pt-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1a1210]">
            {editing ? `Edit /go/${editing.code}` : "New QR code"}
          </h3>
          {editing && (
            <a href="/advertise/admin#qr" className="text-xs text-[#9a8b7d] hover:text-[#1a1210]">
              Cancel
            </a>
          )}
        </div>

        <input type="hidden" name="isNew" value={editing ? "0" : "1"} />

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="code">
              Code <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="code"
              name="code"
              defaultValue={editing?.code}
              readOnly={Boolean(editing)}
              placeholder="plumb"
              className={`${inputClass} ${editing ? "bg-[#faf6f0] text-[#7a6a5d]" : ""}`}
            />
            <p className="mt-1 text-xs text-[#9a8b7d]">
              {editing
                ? "Can't change — it's already printed."
                : "Short and permanent. Becomes smartscaleagent.com/go/…"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="label">
              What it&apos;s for
            </label>
            <input
              id="label"
              name="label"
              defaultValue={editing?.label}
              placeholder="Rio Grande Plumbing"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="destination">
            Sends people to <span className="text-[#DC2626]">*</span>
          </label>
          <input
            id="destination"
            name="destination"
            type="url"
            defaultValue={editing?.destination}
            placeholder="https://riograndeplumbing.com"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[#9a8b7d]">
            Change this any time — the printed code keeps working.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="logo">
              Logo in the middle (optional)
            </label>
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="w-full text-sm text-[#5c4f45] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1a1210] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
            />
            <p className="mt-1 text-xs text-[#9a8b7d]">
              PNG, JPEG, WebP or SVG, under 200KB. A square logo on a transparent
              or white background works best.
            </p>
            {editing?.logoDataUri && (
              <label className="mt-2 flex items-center gap-2 text-xs text-[#5c4f45]">
                <input type="checkbox" name="removeLogo" value="1" className="accent-[#DC2626]" />
                Remove the current logo
              </label>
            )}
          </div>

          {editing?.logoDataUri && (
            <div>
              <p className={labelClass}>Current logo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editing.logoDataUri}
                alt=""
                className="h-16 w-16 object-contain rounded-lg border border-black/[0.06] bg-white p-1"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm text-[#5c4f45]">
            <input
              type="checkbox"
              name="tagDestination"
              value="1"
              defaultChecked={editing ? editing.tagDestination : true}
              className="accent-[#DC2626]"
            />
            Tag the link so the advertiser sees this traffic in their own analytics
          </label>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-[#DC2626] text-white font-semibold px-6 py-3 hover:bg-[#b91c1c] transition-colors"
        >
          {editing ? "Save changes" : "Create QR code"}
        </button>

        <p className="text-xs text-[#9a8b7d]">
          Adding a logo makes the code denser, so print it larger. Always scan the
          artwork with your own phone before it goes on a screen.
        </p>
      </form>
    </section>
  );
}


/* ----------------------------- monthly reports ---------------------------- */

function ReportCard({ report }: { report: MonthlyReport }) {
  const f = report.facts;
  const sent = report.status === "sent";
  const skipped = report.status === "skipped";

  return (
    <li className="rounded-2xl border border-black/[0.08] bg-[#faf6f0] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#1a1210]">
            {report.business}
            <span className="font-normal text-[#7a6a5d]"> · {f.monthName}</span>
          </p>
          <p className="text-xs text-[#9a8b7d]">
            to {report.email}
            {report.narrative.source === "claude"
              ? " · written by Claude"
              : " · plain summary"}
            {report.narrative.rejectedReason
              ? ` (${report.narrative.rejectedReason})`
              : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            sent
              ? "bg-[#eef7ee] text-[#1f5130]"
              : skipped
                ? "bg-black/[0.05] text-[#9a8b7d]"
                : "bg-[#fdf6e6] text-[#8a6d1f]"
          }`}
        >
          {sent ? "Sent" : skipped ? "Skipped" : "Awaiting review"}
        </span>
      </div>

      <div className="flex flex-wrap gap-5 mt-4 text-sm">
        <span>
          <strong className="text-[#1a1210] tabular-nums">{f.scans.toLocaleString()}</strong>{" "}
          <span className="text-[#7a6a5d]">scans</span>
        </span>
        <span>
          <strong className="text-[#1a1210] tabular-nums">{f.plays.toLocaleString()}</strong>{" "}
          <span className="text-[#7a6a5d]">plays</span>
        </span>
        {f.changePercent !== null && (
          <span className="text-[#7a6a5d]">
            {f.changePercent >= 0 ? "up" : "down"} {Math.abs(f.changePercent)}% on{" "}
            {f.previousScans}
          </span>
        )}
      </div>

      {sent ? (
        <div className="mt-4 text-sm text-[#5c4f45]">
          <p className="font-semibold text-[#1a1210]">{report.narrative.headline}</p>
          <p className="mt-1">{report.narrative.body}</p>
        </div>
      ) : (
        <form action={editReportAction} className="mt-4 space-y-3">
          <input type="hidden" name="advertiserId" value={report.advertiserId} />
          <input type="hidden" name="month" value={report.month} />
          <input
            name="headline"
            defaultValue={report.narrative.headline}
            className={inputClass}
            aria-label="Report headline"
          />
          <textarea
            name="body"
            rows={3}
            defaultValue={report.narrative.body}
            className={inputClass}
            aria-label="Report wording"
          />
          <button
            type="submit"
            className="text-xs font-semibold text-[#7a6a5d] hover:text-[#1a1210]"
          >
            Save wording
          </button>
        </form>
      )}

      {!sent && !skipped && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form action={sendReportAction}>
            <input type="hidden" name="advertiserId" value={report.advertiserId} />
            <input type="hidden" name="month" value={report.month} />
            <button
              type="submit"
              className="rounded-xl bg-[#DC2626] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#b91c1c] transition-colors"
            >
              Approve &amp; send
            </button>
          </form>
          <form action={skipReportAction}>
            <input type="hidden" name="advertiserId" value={report.advertiserId} />
            <input type="hidden" name="month" value={report.month} />
            <button type="submit" className="text-xs text-[#9a8b7d] hover:text-[#DC2626]">
              Skip this one
            </button>
          </form>
          <span className="text-xs text-[#9a8b7d]">
            Read it first — this goes straight to the advertiser.
          </span>
        </div>
      )}
    </li>
  );
}

function MonthlyReports({ reports }: { reports: MonthlyReport[] }) {
  const waiting = reports.filter((r) => r.status === "draft");
  const rest = reports.filter((r) => r.status !== "draft").slice(0, 6);
  const aiOn = isNarrativeConfigured();

  return (
    <section
      id="reports"
      className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8 mb-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1210]">Monthly reports</h2>
          <p className="mt-1 text-sm text-[#7a6a5d]">
            Drafted on the first of each month. Every figure is measured — the
            wording is written for you, and nothing sends until you approve it.
          </p>
        </div>
        <form action={generateReportsAction}>
          <button
            type="submit"
            className="rounded-xl bg-[#1a1210] text-white text-sm font-semibold px-5 py-2.5 hover:bg-black transition-colors"
          >
            Draft last month now
          </button>
        </form>
      </div>

      <div className="mt-4 mb-6">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            aiOn ? "bg-[#eef7ee] text-[#1f5130]" : "bg-[#f3efe8] text-[#7a6a5d]"
          }`}
        >
          {aiOn ? "Claude is writing the commentary" : "Plain summaries (no ANTHROPIC_API_KEY)"}
        </span>
      </div>

      {waiting.length === 0 && rest.length === 0 ? (
        <p className="text-sm text-[#9a8b7d]">
          No reports yet. They appear on the first of the month for every active
          advertiser who has an email address and a QR code.
        </p>
      ) : (
        <>
          {waiting.length > 0 && (
            <ul className="space-y-4">
              {waiting.map((r) => (
                <ReportCard key={`${r.advertiserId}-${r.month}`} report={r} />
              ))}
            </ul>
          )}
          {rest.length > 0 && (
            <details className={waiting.length > 0 ? "mt-6" : ""}>
              <summary className="cursor-pointer text-sm font-semibold text-[#7a6a5d] hover:text-[#1a1210]">
                Already handled ({rest.length})
              </summary>
              <ul className="space-y-4 mt-4">
                {rest.map((r) => (
                  <ReportCard key={`${r.advertiserId}-${r.month}`} report={r} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}

/* --------------------------------- the page -------------------------------- */

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    msg?: string;
    err?: string;
    clash?: string;
    edit?: string;
    sent?: string;
    checked?: string;
    detail?: string;
    editLink?: string;
  }>;
}) {
  const params = await searchParams;

  if (!(await isSignedIn())) {
    return (
      <LockScreen configured={isAdminConfigured()} wrong={params.err === "badkey"} />
    );
  }

  const [advertisers, prospects, dueNotices, schedule, runs, replies, databaseReachable, rawLinks] =
    await Promise.all([
      listAdvertisers(),
      listProspects(),
      findDueNotices(),
      upcomingSchedule(),
      recentRuns(),
      listResponses(),
      isRedisReachable(),
      listLinks(),
    ]);
  const reports = await listReports();

  const links: LinkView[] = await Promise.all(
    rawLinks.map(async (link) => ({
      ...link,
      scans: (await getCodeStats(link.code, 1)).total,
    })),
  );
  const editingLink = params.editLink
    ? links.find((l) => l.code === params.editLink)
    : undefined;
  const knownCodeSet = new Set(links.map((l) => l.code));
  const summary = summarize(advertisers);
  const editing = params.edit
    ? advertisers.find((a) => a.id === params.edit)
    : undefined;
  const needsAttention = [...summary.overdue, ...summary.expiring];

  return (
    <main className="min-h-screen bg-[#faf6f0] px-5 sm:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#DC2626] font-semibold">
              Mex Taco House · Screen Advertising
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-[#1a1210]">
              Ad Tracker
            </h1>
            <p className="mt-2 text-sm text-[#7a6a5d]">
              Who&apos;s running, what&apos;s open, and what&apos;s coming up for renewal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/advertise/stats"
              className="px-4 py-2 rounded-full text-sm font-semibold bg-white text-[#7a6a5d] border border-black/[0.06] hover:border-[#DC2626]/30 hover:text-[#1a1210] transition-all"
            >
              Scan report
            </a>
            <form action={signOutAction}>
              <button
                type="submit"
                className="px-4 py-2 rounded-full text-sm font-semibold bg-white text-[#7a6a5d] border border-black/[0.06] hover:text-[#1a1210] transition-all"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {!isRedisConfigured() ? (
          <div className="rounded-2xl border border-[#f0c674] bg-[#fdf6e6] px-5 py-4 mb-6">
            <p className="text-sm font-semibold text-[#1a1210]">
              No database connected — nothing you enter here will save.
            </p>
            <p className="mt-1 text-sm text-[#5c4f45]">
              In Vercel: Storage → Create Database → Upstash Redis, connect it to this
              project, then redeploy.
            </p>
          </div>
        ) : (
          !databaseReachable && (
            <div className="rounded-2xl border border-[#DC2626]/30 bg-[#fdecec] px-5 py-4 mb-6">
              <p className="text-sm font-semibold text-[#8f1d1d]">
                The database is configured but isn&apos;t responding — nothing will save.
              </p>
              <p className="mt-1 text-sm text-[#5c4f45]">
                Usually this means the token was rotated in Upstash but Vercel still has
                the old one. In Vercel: Storage → your database → reveal the current
                values, make sure{" "}
                <code className="font-mono text-xs">KV_REST_API_TOKEN</code> matches, then
                redeploy.
              </p>
            </div>
          )
        )}

        <Banner
          msg={params.msg}
          err={params.err}
          clash={params.clash}
          sent={params.sent}
          checked={params.checked}
          detail={params.detail}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
            hint="active advertisers"
          />
          <Tile
            label="Contracted"
            value={money(summary.contractedRemaining)}
            hint="left to invoice on current terms"
          />
        </div>

        {needsAttention.length > 0 && (
          <section className="rounded-3xl border border-[#f0c674] bg-[#fdf6e6] p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-[#1a1210]">Needs attention</h2>
            <p className="mt-1 text-sm text-[#5c4f45]">
              Reach out before the term runs out — a lapsed category goes back on the
              market.
            </p>
            <ul className="mt-4 space-y-2">
              {needsAttention.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <span className="font-semibold text-[#1a1210]">
                    {v.business}
                    <span className="font-normal text-[#7a6a5d]"> · {v.category || "no category"}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-[#5c4f45]">
                      {v.overdue
                        ? `ended ${formatDate(v.endDate)}`
                        : `ends ${formatDate(v.endDate)} · ${v.daysRemaining} days`}
                    </span>
                    {v.phone && (
                      <a
                        href={`tel:${v.phone.replace(/[^\d+]/g, "")}`}
                        className="font-semibold text-[#DC2626] hover:underline"
                      >
                        Call
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <RenewalWatch
          due={dueNotices}
          schedule={schedule}
          runs={runs}
          replies={replies}
        />

        <section className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-[#1a1210] mb-4">The rotation</h2>
          {advertisers.length === 0 ? (
            <p className="text-sm text-[#9a8b7d]">
              No advertisers yet. Add the first one below.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
              <table className="w-full text-sm min-w-[54rem]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#9a8b7d]">
                    <th className="px-4 py-2 font-semibold">Business</th>
                    <th className="px-4 py-2 font-semibold">Category</th>
                    <th className="px-4 py-2 font-semibold">Package</th>
                    <th className="px-4 py-2 font-semibold">Started</th>
                    <th className="px-4 py-2 font-semibold">Ends</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold">QR</th>
                    <th className="px-4 py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {advertisers.map((view) => (
                    <RosterRow key={view.id} view={view} knownCodes={knownCodeSet} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {summary.takenCategories.length > 0 && (
            <div className="mt-6 pt-5 border-t border-black/[0.06]">
              <p className={labelClass}>Categories locked</p>
              <div className="flex flex-wrap gap-2">
                {summary.takenCategories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-[#faf6f0] border border-black/[0.06] px-3 py-1 text-xs text-[#5c4f45]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <MonthlyReports reports={reports} />

        <QrCodes links={links} editing={editingLink} />

        <div className="mb-6">
          <AdvertiserForm editing={editing} codes={links} />
        </div>

        <section className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[#1a1210]">Interested list</h2>
          <p className="mt-1 mb-5 text-sm text-[#7a6a5d]">
            Businesses waiting on a slot or a category.
          </p>

          <ProspectList prospects={prospects} />

          <form
            action={saveProspectAction}
            className="mt-6 pt-6 border-t border-black/[0.06] grid sm:grid-cols-3 gap-4"
          >
            <Field label="Business" name="business" id="prospect-business" required />
            <Field label="Category wanted" name="category" id="prospect-category" />
            <Field label="Contact name" name="contactName" id="prospect-contact" />
            <Field label="Phone" name="phone" id="prospect-phone" type="tel" />
            <Field label="Email" name="email" id="prospect-email" type="email" />
            <Field
              label="Source"
              name="source"
              id="prospect-source"
              placeholder="Walk-in, referral, QR scan…"
            />
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="prospect-notes">
                Notes
              </label>
              <input id="prospect-notes" name="notes" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="prospect-status">
                Interest
              </label>
              <select id="prospect-status" name="status" defaultValue="new" className={inputClass}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="hot">Hot</option>
                <option value="passed">Passed</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="rounded-xl bg-[#1a1210] text-white font-semibold px-6 py-3 hover:bg-black transition-colors"
              >
                Add to list
              </button>
            </div>
          </form>
        </section>

        <p className="mt-10 text-xs text-[#9a8b7d] max-w-2xl">
          End dates are calculated from each package term, in Houston time. QR codes are
          managed separately in the link registry — a code shown here in red exists on
          this record but not in the registry, so scanning it would fall through to the
          advertise page.
        </p>
      </div>
    </main>
  );
}
