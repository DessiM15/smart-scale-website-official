/**
 * Payments: who has paid, who has not, and what the venue is owed.
 *
 * Expected payments come from each deal; nothing has to be typed for a late
 * one to show up. Recording money is the one thing that does, and the Mark
 * paid button is that.
 */

import type { ExpectedPayment, ExpectedStatus, MonthBook } from "@/lib/ads/expected";
import { PAYMENT_METHODS } from "@/lib/ads/payments";
import { formatDate } from "@/lib/ads/roster";
import { monthLabel } from "@/lib/ads/statement";
import type { Venue } from "@/lib/ads/venues";
import { MarkPaid } from "./today";
import { ADMIN, clientHref } from "./types";
import {
  Badge,
  Card,
  Empty,
  FilterPill,
  Note,
  Tile,
  bebas,
  btnGhost,
  btnSm,
  cardClass,
  labelClass,
  money,
  numClass,
  selectClass,
  serif,
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
      <form method="get" className="flex items-center gap-2">
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
        <button type="submit" className={`${btnGhost} ${btnSm}`}>Go</button>
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

export function MonthTiles({ book, owedToVenues, anyDeal }: { book: MonthBook; owedToVenues: number; anyDeal: boolean }) {
  const share = owedToVenues;
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
        label="Owed to venues"
        value={anyDeal ? money(share) : "Not set"}
        hint={anyDeal ? "rent plus each location's share" : "set each location's deal on Locations"}
      />
      <Tile
        label="Net to Smart Scale"
        value={money(book.collected - share)}
        hint={anyDeal ? "after rent and shares" : "before any venue deal"}
      />
    </div>
  );
}

function Row({ e, month, venueName }: { e: ExpectedPayment; month: string; venueName?: string }) {
  const status = STATUS[e.status];
  const returnTo = `${PAGE}?month=${month}`;
  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className={tdClass}>
        <a href={clientHref(e.advertiserId, "payments")} className="group">
          <span className={`${serif} text-[19px] leading-none text-white group-hover:text-[#f87171] transition-colors`}>{e.business}</span>
        </a>
        <p className="text-xs text-white/40 mt-1">
          {e.label}
          {venueName ? ` · ${venueName}` : ""}
        </p>
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

function MobileRow({ e, month, venueName }: { e: ExpectedPayment; month: string; venueName?: string }) {
  const status = STATUS[e.status];
  const returnTo = `${PAGE}?month=${month}`;
  return (
    <li className={`${cardClass} p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a href={clientHref(e.advertiserId, "payments")} className={`${serif} text-[19px] leading-none text-white`}>{e.business}</a>
          <p className="text-xs text-white/40 mt-1">
            {e.label} · due {formatDate(e.dueDate)}
            {venueName ? ` · ${venueName}` : ""}
          </p>
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

export function MonthTable({ book, filter, venueNames }: { book: MonthBook; filter: PaymentsFilter; venueNames?: Map<string, string> }) {
  const rows = filter === "all" ? book.rows : book.rows.filter((r) => r.status === filter);
  const nameOf = (e: ExpectedPayment) => venueNames?.get(e.venueId || "mex-taco-house");
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
              <Row key={`${e.advertiserId}-${e.period}`} e={e} month={book.month} venueName={nameOf(e)} />
            ))}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden flex flex-col gap-3">
        {rows.map((e) => (
          <MobileRow key={`${e.advertiserId}-${e.period}`} e={e} month={book.month} venueName={nameOf(e)} />
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

/* -------------------------------- locations ------------------------------- */

export type VenueOwedLine = {
  venue: Venue;
  /** Collected this month from this location's advertisers. */
  collected: number;
  rent: number;
  share: number;
  total: number;
  hasDeal: boolean;
};

/**
 * What each location is owed for the month: its rent, and its share of what
 * its own advertisers paid. The deal itself is set on the Locations page;
 * when a payment falls due it appears on Today, and logging it there is what
 * writes it into the books.
 */
export function VenuesOwed({ lines, month, several }: { lines: VenueOwedLine[]; month: string; several: boolean }) {
  return (
    <div id="venue" className="mt-10 scroll-mt-28">
      <Card
        title={several ? "Owed to each location" : "Owed to the venue"}
        lede={`For ${monthLabel(month)}: rent is fixed, the share is on money actually collected from that location's advertisers. Set or change a deal on the Locations page.`}
        action={
          <a href={`${ADMIN}/locations`} className={`${btnGhost} ${btnSm}`}>
            Locations
          </a>
        }
      >
        {lines.every((l) => !l.hasDeal) && (
          <div className="mb-5">
            <Note tone="warn">
              <p className="text-sm text-white">No rent or revenue share is set on any location. Statements report what was collected without splitting it.</p>
            </Note>
          </div>
        )}
        <ul className="grid md:grid-cols-2 gap-3">
          {lines.map((l) => (
            <li key={l.venue.id} className={`${cardClass} p-4 flex flex-col gap-3`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`${serif} text-[20px] leading-none text-white`}>{l.venue.name}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {l.hasDeal
                      ? [l.venue.deal.rentMonthly > 0 && `${money(l.venue.deal.rentMonthly)} rent`, l.venue.deal.sharePercent > 0 && `${l.venue.deal.sharePercent}% share`].filter(Boolean).join(" + ")
                      : "no deal set"}
                    {l.venue.ownerName ? ` · ${l.venue.ownerName}` : ""}
                  </p>
                </div>
                <span className={`${numClass} text-2xl text-white whitespace-nowrap`}>{l.hasDeal ? money(l.total) : "—"}</span>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className={`${labelClass} !mb-0.5`}>Collected</dt>
                  <dd className="text-white/80 tabular-nums">{money(l.collected)}</dd>
                </div>
                <div>
                  <dt className={`${labelClass} !mb-0.5`}>Rent</dt>
                  <dd className="text-white/80 tabular-nums">{l.rent > 0 ? money(l.rent) : "—"}</dd>
                </div>
                <div>
                  <dt className={`${labelClass} !mb-0.5`}>Share</dt>
                  <dd className="text-white/80 tabular-nums">{l.venue.deal.sharePercent > 0 ? money(l.share) : "—"}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-center gap-3">
                <a href={`${ADMIN}/statement/${month}${several ? `?venue=${l.venue.id}` : ""}`} className={`${bebas} text-[11px] tracking-[0.22em] text-white/60 hover:text-white border-b border-white/20 hover:border-white pb-0.5`}>
                  Statement for {monthLabel(month)}
                </a>
                <a href={`${ADMIN}/locations#venue-${l.venue.id}`} className={`${bebas} text-[11px] tracking-[0.22em] text-white/40 hover:text-white`}>
                  The deal
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
