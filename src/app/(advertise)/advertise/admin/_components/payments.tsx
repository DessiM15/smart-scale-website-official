/**
 * Payments: who has paid, who has not, and what the venue is owed.
 *
 * Expected payments come from each deal; nothing has to be typed for a late
 * one to show up. Recording money is the one thing that does, and the Mark
 * paid button is that.
 */

import { saveVenueSettingsAction } from "../actions";
import type { ExpectedPayment, ExpectedStatus, MonthBook } from "@/lib/ads/expected";
import { PAYMENT_METHODS } from "@/lib/ads/payments";
import { formatDate } from "@/lib/ads/roster";
import { venueShareOf, type Settings } from "@/lib/ads/settings";
import { monthLabel } from "@/lib/ads/statement";
import { SubmitButton } from "./submit-button";
import { MarkPaid } from "./today";
import { ADMIN, clientHref } from "./types";
import {
  Badge,
  Card,
  Empty,
  Field,
  FilterPill,
  Note,
  Tile,
  bebas,
  btnGhost,
  btnPrimary,
  btnSm,
  cardClass,
  inputClass,
  labelClass,
  money,
  numClass,
  selectClass,
  serif,
  stamp,
  tdClass,
  thClass,
  type Tone,
} from "./ui";

const PAGE = `${ADMIN}/payments`;

const STATUS: Record<ExpectedStatus, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "ok" },
  scheduled: { label: "Scheduled", tone: "neutral" },
  due: { label: "Due", tone: "warn" },
  late: { label: "Late", tone: "bad" },
};

const methodLabel = (id?: string) => PAYMENT_METHODS.find((m) => m.id === id)?.label ?? (id ? id : "");

export type PaymentsFilter = "all" | ExpectedStatus;

export function MonthControls({
  months,
  month,
  filter,
  book,
}: {
  months: string[];
  month: string;
  filter: PaymentsFilter;
  book: MonthBook;
}) {
  const href = (f: PaymentsFilter) => `${PAGE}?month=${month}${f === "all" ? "" : `&show=${f}`}`;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <form method="get" className="relative">
        <label className="sr-only" htmlFor="month">Month</label>
        <select
          id="month"
          name="month"
          defaultValue={month}
          className={`${selectClass} w-auto min-w-[200px] py-2.5 pr-10`}
        >
          {months.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
        {filter !== "all" && <input type="hidden" name="show" value={filter} />}
        <button type="submit" className={`${btnGhost} ${btnSm} ml-2`}>Go</button>
      </form>
      <span className="hidden sm:block w-px h-6 bg-white/10 mx-1" />
      <FilterPill href={href("all")} on={filter === "all"}>All</FilterPill>
      <FilterPill href={href("paid")} on={filter === "paid"} count={book.counts.paid}>Paid</FilterPill>
      <FilterPill href={href("due")} on={filter === "due"} count={book.counts.due}>Due</FilterPill>
      <FilterPill href={href("late")} on={filter === "late"} count={book.counts.late}>Late</FilterPill>
      <FilterPill href={href("scheduled")} on={filter === "scheduled"} count={book.counts.scheduled}>Scheduled</FilterPill>
    </div>
  );
}

export function MonthTiles({ book, sharePercent }: { book: MonthBook; sharePercent: number }) {
  const share = venueShareOf(book.collected, sharePercent);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Tile
        label="Collected"
        value={money(book.collected)}
        hint={`${book.counts.paid} of ${book.rows.length} expected payments`}
        tone={book.collected > 0 ? "ok" : "plain"}
      />
      <Tile
        label="Outstanding"
        value={money(book.outstanding)}
        hint={`${book.counts.due} due · ${book.counts.late} late · ${book.counts.scheduled} not yet due`}
        tone={book.counts.late > 0 ? "alert" : book.counts.due > 0 ? "warn" : "plain"}
      />
      <Tile
        label="Venue share"
        value={sharePercent > 0 ? money(share) : "Not set"}
        hint={sharePercent > 0 ? `${sharePercent}% of collected` : "set the split below"}
      />
      <Tile
        label="Net to Smart Scale"
        value={money(book.collected - share)}
        hint={sharePercent > 0 ? "after the venue share" : "before any venue share"}
      />
    </div>
  );
}

function Row({ e, month }: { e: ExpectedPayment; month: string }) {
  const status = STATUS[e.status];
  const returnTo = `${PAGE}?month=${month}`;
  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className={tdClass}>
        <a href={clientHref(e.advertiserId, "payments")} className="group">
          <span className={`${serif} text-[19px] leading-none text-white group-hover:text-[#f87171] transition-colors`}>{e.business}</span>
        </a>
        <p className="text-xs text-white/40 mt-1">{e.label}</p>
      </td>
      <td className={`${tdClass} text-sm text-white/80 whitespace-nowrap`}>{formatDate(e.dueDate)}</td>
      <td className={`${tdClass} text-sm text-white/80`}>{e.status === "paid" ? methodLabel(e.paidWith) : "—"}</td>
      <td className={tdClass}>
        <Badge tone={status.tone}>
          {status.label}
          {e.status === "late" ? ` · ${e.daysLate}d` : ""}
        </Badge>
      </td>
      <td className={`${tdClass} text-sm text-white/80 whitespace-nowrap`}>{e.paidOn ? formatDate(e.paidOn) : "—"}</td>
      <td className={`${tdClass} ${numClass} text-[19px] text-white text-right whitespace-nowrap`}>
        ${e.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </td>
      <td className={`${tdClass} text-right`}>
        {e.status !== "paid" && <MarkPaid advertiserId={e.advertiserId} period={e.period} amount={e.amount} returnTo={returnTo} />}
      </td>
    </tr>
  );
}

function MobileRow({ e, month }: { e: ExpectedPayment; month: string }) {
  const status = STATUS[e.status];
  const returnTo = `${PAGE}?month=${month}`;
  return (
    <li className={`${cardClass} p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a href={clientHref(e.advertiserId, "payments")} className={`${serif} text-[19px] leading-none text-white`}>{e.business}</a>
          <p className="text-xs text-white/40 mt-1">{e.label} · due {formatDate(e.dueDate)}</p>
        </div>
        <span className={`${numClass} text-xl text-white whitespace-nowrap`}>${e.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Badge tone={status.tone}>
          {status.label}
          {e.status === "paid" && e.paidOn ? ` · ${formatDate(e.paidOn)}` : e.status === "late" ? ` · ${e.daysLate}d` : ""}
        </Badge>
        {e.status !== "paid" && <MarkPaid advertiserId={e.advertiserId} period={e.period} amount={e.amount} returnTo={returnTo} />}
      </div>
    </li>
  );
}

export function MonthTable({ book, filter }: { book: MonthBook; filter: PaymentsFilter }) {
  const rows = filter === "all" ? book.rows : book.rows.filter((r) => r.status === filter);
  if (rows.length === 0) {
    return (
      <Empty>
        {book.rows.length === 0
          ? `Nothing was due in ${monthLabel(book.month)}. Expected payments come from each client's deal, so a month with no terms running has none.`
          : `No ${filter} payments in ${monthLabel(book.month)}.`}
      </Empty>
    );
  }
  return (
    <>
      <div className={`${cardClass} hidden md:block overflow-x-auto`}>
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th className={thClass}>Business</th>
              <th className={thClass}>Due</th>
              <th className={thClass}>Method</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Paid on</th>
              <th className={`${thClass} text-right`}>Amount</th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <Row key={`${e.advertiserId}-${e.period}`} e={e} month={book.month} />
            ))}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden flex flex-col gap-3">
        {rows.map((e) => (
          <MobileRow key={`${e.advertiserId}-${e.period}`} e={e} month={book.month} />
        ))}
      </ul>
      <p className="mt-4 text-xs text-white/35 leading-relaxed max-w-2xl">
        Expected payments are worked out from each deal, so nothing has to be typed for a late one to appear. Recording
        the money is the one thing that does: Mark paid on the row, or the Payments panel on the client. A Stripe payment
        does not mark itself yet.
      </p>
    </>
  );
}

/* --------------------------------- venue ---------------------------------- */

export function VenueSplit({
  settings,
  collectedThisMonth,
  currentMonth,
}: {
  settings: Settings;
  collectedThisMonth: number;
  currentMonth: string;
}) {
  const share = settings.venueSharePercent;
  const months: string[] = [];
  const base = new Date(`${currentMonth}-01T12:00:00Z`);
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }

  return (
    <div id="venue" className="grid lg:grid-cols-[1.2fr_1fr] gap-5 mt-10 scroll-mt-28">
      <Card
        title="The venue's split"
        lede="What the venue owner takes of what advertisers actually pay. Changing it applies to statements from here on, never to one already issued."
      >
        {share === 0 && (
          <div className="mb-5">
            <Note tone="warn">
              <p className="text-sm text-white">No revenue share is set. Statements report what was collected without splitting it.</p>
            </Note>
          </div>
        )}
        <form action={saveVenueSettingsAction} className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="venueSharePercent">Their percentage</label>
            <input
              id="venueSharePercent"
              name="venueSharePercent"
              inputMode="decimal"
              defaultValue={share ? String(share) : ""}
              placeholder="30"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-white/30">Of money collected, not invoiced.</p>
          </div>
          <Field label="Owner's name" name="venueOwnerName" id="venueOwnerName" defaultValue={settings.venueOwnerName} />
          <Field label="Owner's email" name="venueOwnerEmail" id="venueOwnerEmail" type="email" defaultValue={settings.venueOwnerEmail} />
          <div className="sm:col-span-3 flex flex-wrap items-center gap-4">
            <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Saving">
              Save
            </SubmitButton>
            {settings.updatedAt && <span className="text-xs text-white/30">Last changed {stamp(settings.updatedAt)}</span>}
            <span className="text-xs text-white/30">
              Owed so far this month: {money(venueShareOf(collectedThisMonth, share))}
            </span>
          </div>
        </form>
      </Card>

      <Card
        title="Statements"
        lede="One per month: every payment received, what each advertiser did, and the share owed. Open one and print it to PDF."
      >
        <ul className="grid grid-cols-2 gap-2">
          {months.map((m) => (
            <li key={m}>
              <a
                href={`${ADMIN}/statement/${m}`}
                className={`flex items-center justify-between gap-2 border border-white/[0.08] px-3.5 py-3 hover:border-white/30 hover:bg-white/[0.03] transition-colors`}
              >
                <span className="text-sm text-white">{monthLabel(m)}</span>
                <span className={`${bebas} text-[10px] tracking-[0.2em] text-white/35`}>{m === currentMonth ? "So far" : "Open"}</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
