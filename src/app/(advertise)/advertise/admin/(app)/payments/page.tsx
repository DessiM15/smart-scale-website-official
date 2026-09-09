import type { Metadata } from "next";
import { cachedAdvertisers, cachedPaymentsByAdvertiser } from "@/lib/ads/cached";
import { monthBook, monthsWithActivity } from "@/lib/ads/expected";
import { today } from "@/lib/ads/roster";
import { getSettings } from "@/lib/ads/settings";
import { monthLabel } from "@/lib/ads/statement";
import { PageHeader } from "../../_components/shell";
import { MonthControls, MonthTable, MonthTiles, VenueSplit, type PaymentsFilter } from "../../_components/payments";
import { btnGhost } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Payments" };

const FILTERS: PaymentsFilter[] = ["all", "paid", "scheduled", "due", "late"];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; show?: string; msg?: string; err?: string; detail?: string }>;
}) {
  const [params, advertisers, settings] = await Promise.all([searchParams, cachedAdvertisers(), getSettings()]);
  const asOf = today();
  const currentMonth = asOf.slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : currentMonth;
  const filter = FILTERS.includes(params.show as PaymentsFilter) ? (params.show as PaymentsFilter) : "all";

  const payments = await cachedPaymentsByAdvertiser(advertisers.map((a) => a.id));
  const book = monthBook(advertisers, payments, month, asOf);
  const thisMonth = month === currentMonth ? book : monthBook(advertisers, payments, currentMonth, asOf);
  const months = monthsWithActivity(advertisers, asOf);

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
      <MonthTiles book={book} sharePercent={settings.venueSharePercent} />
      <MonthTable book={book} filter={filter} />
      <VenueSplit settings={settings} collectedThisMonth={thisMonth.collected} currentMonth={currentMonth} />
    </Shell>
  );
}
