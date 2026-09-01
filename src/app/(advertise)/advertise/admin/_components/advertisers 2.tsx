/**
 * The rotation: who is on the screens, and the form that puts them there.
 *
 * The table is the desktop view only — below `md` each advertiser becomes a
 * card, because eight columns of contract detail can't survive a phone.
 */

import { deleteAdvertiserAction, saveAdvertiserAction } from "../actions";
import {
  formatDate,
  today,
  PLAN_LIST,
  type AdvertiserView,
  type RosterSummary,
} from "@/lib/ads/roster";
import type { LinkView } from "./types";
import { tabHref } from "./types";
import {
  Card,
  Empty,
  Field,
  Pill,
  SubHead,
  btnPrimary,
  inputClass,
  labelClass,
  linkAction,
  linkQuiet,
  money,
  selectClass,
  type Tone,
} from "./ui";

const STATUS_LABEL = {
  active: "Running",
  pending: "Signed, not live",
  ended: "Ended",
} as const;

function statusOf(view: AdvertiserView): { label: string; tone: Tone } {
  if (view.overdue) return { label: "Term ended", tone: "brand" };
  if (view.expiringSoon)
    return { label: `${view.daysRemaining}d left`, tone: "warn" };
  if (view.status === "active") return { label: STATUS_LABEL.active, tone: "ok" };
  if (view.status === "pending")
    return { label: STATUS_LABEL.pending, tone: "neutral" };
  return { label: STATUS_LABEL.ended, tone: "neutral" };
}

function StatusPill({ view }: { view: AdvertiserView }) {
  const { label, tone } = statusOf(view);
  return <Pill tone={tone}>{label}</Pill>;
}

function QrCell({ view, knownCodes }: { view: AdvertiserView; knownCodes: Set<string> }) {
  if (!view.qrCode) return <span className="text-xs text-white/25">none</span>;
  const missing = !knownCodes.has(view.qrCode);
  return (
    <>
      <span className="font-mono text-xs text-[#f87171]">/go/{view.qrCode}</span>
      {missing && (
        <p className="text-xs text-[#f87171] mt-0.5">not in the link registry</p>
      )}
    </>
  );
}

function RowActions({ id }: { id: string }) {
  return (
    <>
      {/* The anchor jumps to the editor, which is below the roster. */}
      <a href={`${tabHref("advertisers", { edit: id })}#editor`} className={linkAction}>
        Edit
      </a>
      <form action={deleteAdvertiserAction} className="inline">
        <input type="hidden" name="id" value={id} />
        <button type="submit" className={`ml-4 ${linkQuiet}`}>
          Remove
        </button>
      </form>
    </>
  );
}

function RosterRow({
  view,
  knownCodes,
}: {
  view: AdvertiserView;
  knownCodes: Set<string>;
}) {
  return (
    <tr className="border-t border-white/[0.06] align-top hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-4 w-[24%]">
        <p className="font-semibold text-white">{view.business}</p>
        {view.contactName && (
          <p className="text-xs text-white/35 mt-0.5">{view.contactName}</p>
        )}
        {(view.email || view.phone) && (
          <p className="text-xs text-white/35">
            {[view.email, view.phone].filter(Boolean).join(" · ")}
          </p>
        )}
      </td>
      <td className="px-4 py-4 text-white/60 whitespace-nowrap">
        {view.category || "—"}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-white/60">{view.planName}</p>
        <p className="text-xs text-white/30 tabular-nums">
          {view.monthly ? `${money(view.monthly)}/mo` : "no charge"}
        </p>
      </td>
      <td className="px-4 py-4 text-white/60 whitespace-nowrap tabular-nums">
        {formatDate(view.startDate)}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-white/60 tabular-nums">{formatDate(view.endDate)}</p>
        {view.status === "active" && (
          <p className="text-xs text-white/30 tabular-nums">
            {view.daysRemaining >= 0
              ? `${view.daysRemaining} days`
              : `${Math.abs(view.daysRemaining)} days ago`}
          </p>
        )}
      </td>
      <td className="px-4 py-4">
        <StatusPill view={view} />
      </td>
      <td className="px-4 py-4">
        <QrCell view={view} knownCodes={knownCodes} />
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <RowActions id={view.id} />
      </td>
    </tr>
  );
}

function RosterCard({
  view,
  knownCodes,
}: {
  view: AdvertiserView;
  knownCodes: Set<string>;
}) {
  return (
    <li className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{view.business}</p>
          <p className="text-xs text-white/35 mt-0.5">
            {view.category || "no category"} · {view.planName}
          </p>
        </div>
        <StatusPill view={view} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-white/30 font-semibold">
            Runs
          </dt>
          <dd className="text-white/70 tabular-nums mt-0.5">
            {formatDate(view.startDate)} → {formatDate(view.endDate)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-white/30 font-semibold">
            Rate
          </dt>
          <dd className="text-white/70 tabular-nums mt-0.5">
            {view.monthly ? `${money(view.monthly)}/mo` : "no charge"}
          </dd>
        </div>
      </dl>

      {(view.contactName || view.email || view.phone) && (
        <p className="mt-3 text-xs text-white/35">
          {[view.contactName, view.email, view.phone].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <QrCell view={view} knownCodes={knownCodes} />
        <span className="whitespace-nowrap">
          <RowActions id={view.id} />
        </span>
      </div>
    </li>
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
    // Open automatically when an edit is in flight, otherwise closed — the form
    // is used a few times a month and shouldn't own the screen the rest of it.
    <details
      id="editor"
      open={Boolean(editing)}
      className="group rounded-3xl border border-white/[0.07] bg-[#131313] overflow-hidden"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 sm:px-8 py-5 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
        <span className="text-white font-semibold">
          {editing ? `Edit ${editing.business}` : "Add an advertiser"}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:hidden">
          Open
        </span>
        <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:inline">
          Close
        </span>
      </summary>

      <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-white/[0.06]">
        {editing && (
          <a href={tabHref("advertisers")} className={`${linkQuiet} inline-block mb-5`}>
            Cancel edit
          </a>
        )}

        <form action={saveAdvertiserAction} className="space-y-5">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Business"
              name="business"
              defaultValue={editing?.business}
              required
            />
            <Field
              label="Category (locked)"
              name="category"
              defaultValue={editing?.category}
              placeholder="Plumbing, Dentistry, Auto Repair…"
            />
            <Field
              label="Contact name"
              name="contactName"
              defaultValue={editing?.contactName}
            />
            <Field label="Phone" name="phone" type="tel" defaultValue={editing?.phone} />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={editing?.email}
            />
            <div>
              <label className={labelClass} htmlFor="qrCode">
                QR code
              </label>
              <select
                id="qrCode"
                name="qrCode"
                defaultValue={editing?.qrCode ?? ""}
                className={selectClass}
              >
                <option value="">— none —</option>
                {codes.map((link) => (
                  <option key={link.code} value={link.code}>
                    /go/{link.code} — {link.label}
                    {link.active ? "" : " (retired)"}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-white/30">
                Create codes on the QR codes tab.
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
                className={selectClass}
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
                className={selectClass}
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

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button type="submit" className={`${btnPrimary} px-6 py-3`}>
              {editing ? "Save changes" : "Add advertiser"}
            </button>
            <p className="text-xs text-white/30">
              The end date is calculated from the package term —{" "}
              {editing ? `currently ${formatDate(editing.endDate)}` : "no need to enter it"}.
            </p>
          </div>
        </form>
      </div>
    </details>
  );
}

/* ---------------------------------- tab ----------------------------------- */

export function AdvertisersTab({
  advertisers,
  summary,
  knownCodes,
  links,
  editing,
}: {
  advertisers: AdvertiserView[];
  summary: RosterSummary;
  knownCodes: Set<string>;
  links: LinkView[];
  editing?: AdvertiserView;
}) {
  return (
    <>
      <Card
        title="The rotation"
        lede="Every business on the screens, in the order they were added."
        className="mb-5"
      >
        {advertisers.length === 0 ? (
          <Empty>No advertisers yet. Add the first one below.</Empty>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
              <table className="w-full text-sm min-w-[64rem]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-white/35">
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
                    <RosterRow key={view.id} view={view} knownCodes={knownCodes} />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="md:hidden space-y-3">
              {advertisers.map((view) => (
                <RosterCard key={view.id} view={view} knownCodes={knownCodes} />
              ))}
            </ul>
          </>
        )}

        {summary.takenCategories.length > 0 && (
          <div className="mt-7 pt-6 border-t border-white/[0.06]">
            <SubHead>Categories locked</SubHead>
            <div className="flex flex-wrap gap-2">
              {summary.takenCategories.map((c) => (
                <Pill key={c}>{c}</Pill>
              ))}
            </div>
          </div>
        )}
      </Card>

      <AdvertiserForm editing={editing} codes={links} />
    </>
  );
}
