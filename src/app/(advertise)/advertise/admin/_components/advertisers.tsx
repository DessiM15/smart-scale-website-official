/**
 * The rotation: who is on the screens, and everything about each of them.
 *
 * One table. A row opens in place into the client's detail (deal, codes,
 * artwork, agreement, payments, notes), so there is no separate profile page
 * to go and come back from.
 */

import { deleteAdvertiserAction } from "../actions";
import { AdvertiserForm, type ConversionPrefill, type EditingAdvertiser } from "./advertiser-form";
import { ClientDetail, type ClientData, type ClientPanel } from "./client-detail";
import {
  artworkStatusOf,
  ARTWORK_STATUSES,
  formatDate,
  today,
  PLAN_LIST,
  type AdvertiserView,
} from "@/lib/ads/roster";
import type { ExpectedPayment } from "@/lib/ads/expected";
import { SubmitButton } from "./submit-button";
import { ADMIN, clientHref, tabHref, type LinkView } from "./types";
import {
  Badge,
  Empty,
  FilterPill,
  bebas,
  btnDanger,
  btnGhost,
  btnSm,
  cardClass,
  inputClass,
  money,
  numClass,
  serif,
  tdClass,
  thClass,
  type Tone,
} from "./ui";

const PAGE = `${ADMIN}/advertisers`;

export type AdvertiserFilter = "all" | "active" | "pending" | "ending" | "ended" | "artwork";

function statusOf(view: AdvertiserView): { label: string; tone: Tone } {
  if (view.overdue) return { label: "Term ended", tone: "bad" };
  if (view.expiringSoon) return { label: `${view.daysRemaining}d left`, tone: "warn" };
  if (view.status === "active") return { label: "Running", tone: "ok" };
  if (view.status === "pending") return { label: "Signed", tone: "neutral" };
  return { label: "Ended", tone: "neutral" };
}

const ART_TONE: Record<string, Tone> = { requested: "bad", received: "warn", approved: "warn", "on-screen": "ok" };
const PAY_TONE: Record<string, Tone> = { paid: "ok", scheduled: "neutral", due: "warn", late: "bad" };

export type RowExtras = {
  /** Their next expected payment that is not yet paid, or the last one paid. */
  payment?: ExpectedPayment;
  scans30: number;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={open ? "rotate-90" : ""}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function RosterRow({ view, extras, open }: { view: AdvertiserView; extras: RowExtras; open: boolean }) {
  const status = statusOf(view);
  const art = artworkStatusOf(view);
  const artLabel = ARTWORK_STATUSES.find((s) => s.id === art)?.label ?? art;
  const pay = extras.payment;
  const href = open ? PAGE : clientHref(view.id);
  return (
    <tr id={`client-${view.id}`} className={`scroll-mt-28 transition-colors ${open ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}>
      <td className={tdClass}>
        <a href={href} className="group block">
          <span className={`${serif} text-[19px] leading-none text-white group-hover:text-[#f87171] transition-colors`}>{view.business}</span>
          <span className="block text-xs text-white/40 mt-1">
            {view.category || "no category"}
            {view.slot ? ` · slot ${view.slot}` : ""}
            {view.needsPaperwork && view.status === "active" ? " · unsigned" : ""}
          </span>
        </a>
      </td>
      <td className={tdClass}>
        <p className="text-sm text-white/85">{view.planName}</p>
        <p className="text-xs tabular-nums">
          <span className={view.isCustom ? "text-[#E0B36A]" : "text-white/40"}>{view.monthly ? `${money(view.monthly)}/mo` : "no charge"}</span>
          {view.isCustom && view.monthly !== view.listMonthly && <span className="ml-1.5 text-white/25 line-through">{money(view.listMonthly)}</span>}
          {view.soldAsTotal && <span className="ml-1.5 text-white/40">{money(view.termValue)} once</span>}
        </p>
      </td>
      <td className={`${tdClass} whitespace-nowrap`}>
        <p className="text-sm text-white/85 tabular-nums">{view.status === "pending" ? `Starts ${formatDate(view.startDate)}` : formatDate(view.endDate)}</p>
        <p className={`text-xs tabular-nums ${view.overdue ? "text-[#f87171]" : view.expiringSoon ? "text-[#E0B36A]" : "text-white/40"}`}>
          {view.status === "pending" ? `${view.months} months` : view.daysRemaining >= 0 ? `${view.daysRemaining} days` : `${Math.abs(view.daysRemaining)} days ago`}
        </p>
      </td>
      <td className={tdClass}>
        <Badge tone={status.tone}>{status.label}</Badge>
      </td>
      <td className={tdClass}>
        {view.status !== "ended" && <Badge tone={ART_TONE[art]}>{artLabel}</Badge>}
      </td>
      <td className={tdClass}>
        {pay ? (
          <Badge tone={PAY_TONE[pay.status]} title={`${pay.label} · due ${formatDate(pay.dueDate)}`}>
            {pay.status === "paid" ? "Paid" : pay.status === "scheduled" ? "Scheduled" : pay.status === "due" ? "Due" : `Late ${pay.daysLate}d`}
          </Badge>
        ) : (
          <span className="text-xs text-white/25">—</span>
        )}
      </td>
      <td className={`${tdClass} whitespace-nowrap`}>
        <span className={`${numClass} text-lg text-white`}>{extras.scans30.toLocaleString()}</span>
        <span className="text-xs text-white/35"> / 30d</span>
      </td>
      <td className={`${tdClass} text-right`}>
        <a href={href} className="inline-flex text-white/50 hover:text-white" aria-label={open ? "Close" : "Open"}>
          <ChevronIcon open={open} />
        </a>
      </td>
    </tr>
  );
}

function RosterCard({ view, extras, open }: { view: AdvertiserView; extras: RowExtras; open: boolean }) {
  const status = statusOf(view);
  const art = artworkStatusOf(view);
  const pay = extras.payment;
  return (
    <li id={`client-${view.id}`} className={`${cardClass} scroll-mt-24 ${open ? "bg-white/[0.03]" : ""}`}>
      <a href={open ? PAGE : clientHref(view.id)} className="block p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`${serif} text-[20px] leading-none text-white`}>{view.business}</p>
            <p className="text-xs text-white/40 mt-1">
              {view.category || "no category"} · {view.planName}
              {view.slot ? ` · slot ${view.slot}` : ""}
            </p>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {view.status !== "ended" && <Badge tone={ART_TONE[art]}>{ARTWORK_STATUSES.find((s) => s.id === art)?.label}</Badge>}
          {pay && <Badge tone={PAY_TONE[pay.status]}>{pay.status === "late" ? `Late ${pay.daysLate}d` : pay.status}</Badge>}
          <span className="ml-auto text-xs text-white/40 tabular-nums">
            {view.status === "pending" ? `starts ${formatDate(view.startDate)}` : `ends ${formatDate(view.endDate)}`} · {extras.scans30} scans / 30d
          </span>
        </div>
      </a>
    </li>
  );
}

/* ---------------------------------- form ----------------------------------- */

function planOptions() {
  return PLAN_LIST.map((plan) => ({
    id: plan.id,
    label: `${plan.name} · ${plan.months} mo${plan.monthly ? ` · ${money(plan.monthly)}/mo` : " · no charge"}${plan.internalOnly ? " (internal)" : ""}`,
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
    slot: view.slot ?? null,
    artworkStatus: artworkStatusOf(view),
  };
}

/* ---------------------------------- page ----------------------------------- */

export function matchesQuery(view: AdvertiserView, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [view.business, view.category, view.contactName, view.email, view.phone, view.qrCode, view.planName]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q));
}

export function matchesFilter(view: AdvertiserView, filter: AdvertiserFilter): boolean {
  switch (filter) {
    case "all":
      return view.status !== "ended";
    case "active":
      return view.status === "active";
    case "pending":
      return view.status === "pending";
    case "ending":
      return view.status === "active" && (view.expiringSoon || view.overdue);
    case "ended":
      return view.status === "ended";
    case "artwork":
      return view.status !== "ended" && artworkStatusOf(view) !== "on-screen";
  }
}

export function AdvertiserFilters({
  advertisers,
  filter,
  query,
}: {
  advertisers: AdvertiserView[];
  filter: AdvertiserFilter;
  query: string;
}) {
  const count = (f: AdvertiserFilter) => advertisers.filter((v) => matchesFilter(v, f)).length;
  const href = (f: AdvertiserFilter) => `${PAGE}${f === "all" ? "" : `?show=${f}`}`;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <FilterPill href={href("all")} on={filter === "all"} count={count("all")}>All</FilterPill>
      <FilterPill href={href("active")} on={filter === "active"} count={count("active")}>Running</FilterPill>
      <FilterPill href={href("pending")} on={filter === "pending"} count={count("pending")}>Signed, not live</FilterPill>
      <FilterPill href={href("ending")} on={filter === "ending"} count={count("ending")}>Ending soon</FilterPill>
      <FilterPill href={href("artwork")} on={filter === "artwork"} count={count("artwork")}>Artwork not on screen</FilterPill>
      <FilterPill href={href("ended")} on={filter === "ended"} count={count("ended")}>Ended</FilterPill>
      <form method="get" className="ml-auto flex items-center gap-2">
        {filter !== "all" && <input type="hidden" name="show" value={filter} />}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search a business, category, contact or code"
          aria-label="Search advertisers"
          className={`${inputClass} w-64 py-2.5`}
        />
        {query && (
          <a href={href(filter)} className={`${bebas} text-[11px] tracking-[0.2em] text-white/40 hover:text-white`}>
            Clear
          </a>
        )}
      </form>
    </div>
  );
}

export function AdvertisersTab({
  advertisers,
  shown,
  extras,
  open,
  client,
  panel,
  knownCodes,
  links,
  editing,
  prefill,
  query,
}: {
  advertisers: AdvertiserView[];
  shown: AdvertiserView[];
  extras: Map<string, RowExtras>;
  open?: string;
  client?: ClientData;
  panel: ClientPanel;
  knownCodes: Set<string>;
  links: LinkView[];
  editing?: AdvertiserView;
  prefill?: ConversionPrefill;
  query: string;
}) {
  const empty = { scans30: 0 };
  return (
    <>
      {advertisers.length === 0 ? (
        <Empty>No advertisers yet. Add the first one below.</Empty>
      ) : shown.length === 0 ? (
        <Empty>Nothing matches{query ? ` "${query}"` : " this filter"}.</Empty>
      ) : (
        <>
          <div className={`${cardClass} hidden md:block overflow-x-auto`}>
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>Business</th>
                  <th className={thClass}>Plan</th>
                  <th className={thClass}>Ends</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Artwork</th>
                  <th className={thClass}>Payment</th>
                  <th className={thClass}>Scans</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {shown.map((view) => (
                  <RowWithDetail key={view.id} view={view} extras={extras.get(view.id) ?? empty} open={open === view.id} client={open === view.id ? client : undefined} panel={panel} />
                ))}
              </tbody>
            </table>
          </div>
          <ul className="md:hidden flex flex-col gap-3">
            {shown.map((view) => (
              <li key={view.id} className="flex flex-col">
                <RosterCard view={view} extras={extras.get(view.id) ?? empty} open={open === view.id} />
                {open === view.id && client && (
                  <div className={`${cardClass} border-t-0`}>
                    <ClientDetail data={client} panel={panel} />
                    <RemoveClient view={view} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8">
        <AdvertiserForm
          editing={editing ? toEditing(editing) : undefined}
          prefill={prefill}
          codes={links}
          plans={planOptions()}
          today={today()}
        />
      </div>

      {knownCodes.size > 0 && advertisers.some((v) => v.qrCode && !knownCodes.has(v.qrCode)) && (
        <p className="mt-6 text-xs text-white/35 max-w-2xl leading-relaxed">
          A client whose code is missing from the QR registry would send scans to the advertise page. Check the QR codes
          page for: {advertisers.filter((v) => v.qrCode && !knownCodes.has(v.qrCode)).map((v) => `/go/${v.qrCode}`).join(", ")}.
        </p>
      )}
    </>
  );
}

function RowWithDetail({ view, extras, open, client, panel }: { view: AdvertiserView; extras: RowExtras; open: boolean; client?: ClientData; panel: ClientPanel }) {
  return (
    <>
      <RosterRow view={view} extras={extras} open={open} />
      {open && client && (
        <tr>
          <td colSpan={8} className="p-0 border-b border-white/[0.08]">
            <ClientDetail data={client} panel={panel} />
            <RemoveClient view={view} />
          </td>
        </tr>
      )}
    </>
  );
}

/** Editing and removing, at the bottom of an open client, behind a confirm. */
function RemoveClient({ view }: { view: AdvertiserView }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-white/[0.06] bg-white/[0.015]">
      <a href={`${tabHref("advertisers", { edit: view.id })}#editor`} className={`${btnGhost} ${btnSm}`}>
        Edit contract
      </a>
      <details>
        <summary className={`${bebas} cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[11px] tracking-[0.22em] text-white/30 hover:text-[#f87171] transition-colors`}>
          Remove {view.business}
        </summary>
        <form action={deleteAdvertiserAction} className="mt-3 flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={view.id} />
          <span className="text-xs text-white/55">
            This deletes their record. Codes, payments and documents stay in the database but lose their owner. Sure?
          </span>
          <SubmitButton className={`${btnDanger} ${btnSm}`} pendingLabel="Removing">
            Yes, remove
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
