/**
 * The rotation: who is on the screens, and the form that puts them there.
 *
 * The table is the desktop view only — below `md` each advertiser becomes a
 * card, because eight columns of contract detail can't survive a phone.
 */

import { deleteAdvertiserAction } from "../actions";
import { AdvertiserForm, type EditingAdvertiser } from "./advertiser-form";
import {
  formatDate,
  today,
  PLAN_LIST,
  type AdvertiserView,
  type RosterSummary,
} from "@/lib/ads/roster";
import { money as fmtMoney } from "./ui";
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
  return (
    <span className="flex flex-wrap gap-1.5">
      <Pill tone={tone}>{label}</Pill>
      {/* Running with no countersigned agreement for this term. Worth seeing
          from the roster rather than only on the profile. */}
      {view.needsPaperwork && (
        <Pill tone="warn" title="No signed agreement covers this term">
          Unsigned
        </Pill>
      )}
    </span>
  );
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

/** Everything about one client lives on their own page. */
const profileHref = (id: string) => `/advertise/admin/client/${id}`;

function RowActions({ id }: { id: string }) {
  return (
    <>
      <a href={profileHref(id)} className={linkAction}>
        Open
      </a>
      {/* The anchor jumps to the editor, which is below the roster. */}
      <a
        href={`${tabHref("advertisers", { edit: id })}#editor`}
        className={`ml-4 ${linkQuiet}`}
      >
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
        <a
          href={profileHref(view.id)}
          className="font-semibold text-white hover:text-[#f87171] transition-colors"
        >
          {view.business}
        </a>
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
        <p className="text-xs tabular-nums">
          <span className={view.isCustom ? "text-amber-300" : "text-white/30"}>
            {view.monthly ? `${money(view.monthly)}/mo` : "no charge"}
          </span>
          {view.isCustom && view.monthly !== view.listMonthly && (
            <span className="ml-1.5 text-white/25 line-through">
              {money(view.listMonthly)}
            </span>
          )}
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
          <a
            href={profileHref(view.id)}
            className="font-semibold text-white hover:text-[#f87171] transition-colors"
          >
            {view.business}
          </a>
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
          <dd className="tabular-nums mt-0.5">
            <span className={view.isCustom ? "text-amber-300" : "text-white/70"}>
              {view.monthly ? `${money(view.monthly)}/mo` : "no charge"}
            </span>
            {view.isCustom && view.monthly !== view.listMonthly && (
              <span className="ml-1.5 text-white/25 line-through">
                {money(view.listMonthly)}
              </span>
            )}
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

/**
 * The form runs in the browser so a refused save keeps what was typed, which
 * means everything it needs has to cross as plain data — importing plans or
 * date helpers there would pull Redis and node crypto into the bundle.
 */
function planOptions() {
  return PLAN_LIST.map((plan) => ({
    id: plan.id,
    label: `${plan.name} — ${plan.months} mo${
      plan.monthly ? ` · ${fmtMoney(plan.monthly)}/mo` : " · no charge"
    }${plan.internalOnly ? " (internal)" : ""}`,
  }));
}

function toEditing(view: AdvertiserView): EditingAdvertiser {
  return {
    id: view.id,
    business: view.business,
    category: view.category,
    contactName: view.contactName,
    phone: view.phone,
    email: view.email,
    qrCode: view.qrCode,
    plan: view.plan,
    startDate: view.startDate,
    status: view.status,
    paymentType: view.paymentType,
    notes: view.notes,
    customMonthly: view.customMonthly,
    customSetup: view.customSetup,
    customMonths: view.customMonths,
    customTotal: view.customTotal,
    dealNote: view.dealNote,
    isCustom: view.isCustom,
    endDateLabel: formatDate(view.endDate),
  };
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

      <AdvertiserForm
        editing={editing ? toEditing(editing) : undefined}
        codes={links}
        plans={planOptions()}
        today={today()}
      />
    </>
  );
}
