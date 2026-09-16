import type { Metadata } from "next";
import { cachedAdvertisers, cachedPaymentsByAdvertiser, cachedVenues } from "@/lib/ads/cached";
import { monthBook, monthsWithActivity } from "@/lib/ads/expected";
import { atVenue, today } from "@/lib/ads/roster";
import { monthLabel } from "@/lib/ads/statement";
import { hasSeveral, hasDeal, owedForMonth } from "@/lib/ads/venues";
import { PageHeader } from "../../_components/shell";
import { MonthControls, MonthTable, MonthTiles, VenuesOwed, type PaymentsFilter, type VenueOwedLine } from "../../_components/payments";
import { btnGhost } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Payments" };

const FILTERS: PaymentsFilter[] = ["all", "paid", "scheduled", "due", "late"];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; show?: string; msg?: string; err?: string; detail?: string }>;
}) {
  const [params, advertisers, venues] = await Promise.all([searchParams, cachedAdvertisers(), cachedVenues()]);
  const several = hasSeveral(venues);
  const asOf = today();
  const currentMonth = asOf.slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : currentMonth;
  const filter = FILTERS.includes(params.show as PaymentsFilter) ? (params.show as PaymentsFilter) : "all";

  const payments = await cachedPaymentsByAdvertiser(advertisers.map((a) => a.id));
  const book = monthBook(advertisers, payments, month, asOf);
  const months = monthsWithActivity(advertisers, asOf);

  // What each location is owed for the month being looked at, from its own
  // advertisers' collections and its own deal.
  const owed: VenueOwedLine[] = venues
    .filter((v) => v.status !== "ended")
    .map((v) => {
      const theirs = monthBook(atVenue(advertisers, v.id), payments, month, asOf);
      const o = owedForMonth(v, theirs.collected);
      return { venue: v, collected: theirs.collected, rent: o.rent, share: o.share, total: o.total, hasDeal: hasDeal(v) };
    });
  const owedTotal = Math.round(owed.reduce((sum, o) => sum + o.total, 0) * 100) / 100;
  const venueNames = several ? new Map(venues.map((v) => [v.id, v.name])) : undefined;

  return (
    <Shell active="payments" banner={params}>
      <PageHeader
        eyebrow={`Payments · ${monthLabel(month)}`}
        title="Who's paid, who hasn't."
        action={
          <a href={`/advertise/admin/statement/${month}`} className={btnGhost}>
            Statement for the accountant
          </a>
        }
      />
      <MonthControls months={months} month={month} filter={filter} book={book} />
      <MonthTiles book={book} owedToVenues={owedTotal} anyDeal={owed.some((o) => o.hasDeal)} />
      <MonthTable book={book} filter={filter} venueNames={venueNames} />
      <VenuesOwed lines={owed} month={month} several={several} />
    </Shell>
  );
}
