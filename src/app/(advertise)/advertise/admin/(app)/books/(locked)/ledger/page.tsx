import type { Metadata } from "next";
import { cachedClients, cachedEntries, cachedMonths } from "@/lib/ads/cached";
import { today } from "@/lib/ads/roster";
import { TEAM } from "@/lib/ads/who";
import { byCategory, totals, type Entry } from "@/lib/books/ledger";
import { formatCents, isMonth, monthName, shiftMonth } from "@/lib/books/money";
import { BOOKS, LedgerRow, MoneyTiles } from "../../../../_components/books";
import { PageHeader } from "../../../../_components/shell";
import { Card, Empty, FilterPill, btnGhost, btnSm, btnSolid, labelClass, selectClass } from "../../../../_components/ui";
import { Shell } from "../../../shell";
import { todayData } from "../../../nav-counts";

export const metadata: Metadata = { title: "Ledger" };
export const maxDuration = 60;

type Show = "all" | "in" | "out" | "owner";
const SHOWS: Show[] = ["all", "in", "out", "owner"];

function keep(e: Entry, show: Show): boolean {
  if (show === "all") return true;
  if (show === "owner") return e.kind === "contribution" || e.kind === "draw";
  if (show === "in") return e.kind === "income";
  return e.kind === "expense";
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; show?: string; open?: string; msg?: string; err?: string; detail?: string }>;
}) {
  const params = await searchParams;
  const asOf = today();
  const month = isMonth(params.month ?? "") ? params.month! : asOf.slice(0, 7);
  const show = SHOWS.includes(params.show as Show) ? (params.show as Show) : "all";
  const [entries, months, clients, data] = await Promise.all([cachedEntries(month), cachedMonths(), cachedClients(), todayData()]);
  const shown = entries.filter((e) => keep(e, show));
  const sums = totals(entries);
  const page = `${BOOKS}/ledger`;
  const returnTo = `${page}?month=${month}`;
  const href = (s: Show) => `${page}?month=${month}${s === "all" ? "" : `&show=${s}`}`;
  const options = [...new Set([asOf.slice(0, 7), month, ...months])].sort().reverse();
  const outByCategory = byCategory(entries, "expense");
  const counts = {
    in: entries.filter((e) => keep(e, "in")).length,
    out: entries.filter((e) => keep(e, "out")).length,
    owner: entries.filter((e) => keep(e, "owner")).length,
  };

  return (
    <Shell active="ledger" banner={params}>
      <PageHeader
        eyebrow={`Ledger · ${monthName(month)}`}
        title="Every dollar, with a name on it."
        action={
          <a href={`${BOOKS}#log`} className={btnSolid}>
            + Log money
          </a>
        }
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-6">
        <div className="flex items-center gap-2">
          <a href={`${page}?month=${shiftMonth(month, -1)}`} className={`${btnGhost} ${btnSm}`} aria-label="Previous month">
            ←
          </a>
          <form method="get" className="flex items-center gap-2">
            <label className={`${labelClass} sr-only`} htmlFor="month">Month</label>
            <select id="month" name="month" defaultValue={month} className={`${selectClass} w-auto min-w-[170px] py-2.5 pr-10`}>
              {options.map((m) => (
                <option key={m} value={m}>{monthName(m)}</option>
              ))}
            </select>
            {show !== "all" && <input type="hidden" name="show" value={show} />}
            <button type="submit" className={`${btnGhost} ${btnSm}`}>Go</button>
          </form>
          <a href={`${page}?month=${shiftMonth(month, 1)}`} className={`${btnGhost} ${btnSm}`} aria-label="Next month">
            →
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill href={href("all")} on={show === "all"}>All</FilterPill>
          <FilterPill href={href("in")} on={show === "in"} count={counts.in}>In</FilterPill>
          <FilterPill href={href("out")} on={show === "out"} count={counts.out}>Out</FilterPill>
          <FilterPill href={href("owner")} on={show === "owner"} count={counts.owner}>Owner</FilterPill>
        </div>
      </div>

      <MoneyTiles totals={sums} pending={data.pendingReceipts.length} label={monthName(month).split(" ")[0]} />

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        <Card title={`${shown.length} ${shown.length === 1 ? "entry" : "entries"}`} padding="px-5 sm:px-6 pt-5 pb-2">
          {shown.length === 0 ? (
            <div className="pb-4">
              <Empty>
                {entries.length === 0
                  ? `Nothing in ${monthName(month)}. Snap a receipt or log money from the Books page.`
                  : "Nothing matches that filter this month."}
              </Empty>
            </div>
          ) : (
            <ul>
              {shown.map((e) => (
                <LedgerRow key={e.id} entry={e} clients={clients} team={TEAM} today={asOf} open={params.open === e.id} returnTo={returnTo} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Out, by category" padding="px-5 sm:px-6 pt-5 pb-3">
          {outByCategory.length === 0 ? (
            <div className="pb-3">
              <Empty>No expenses this month.</Empty>
            </div>
          ) : (
            <ul>
              {outByCategory.map((c) => (
                <li key={c.category} className="flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0">
                  <span className="text-sm text-white/80 truncate">
                    {c.label} <span className="text-white/35">· {c.count}</span>
                  </span>
                  <span className="text-sm text-white tabular-nums shrink-0">{formatCents(c.cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
