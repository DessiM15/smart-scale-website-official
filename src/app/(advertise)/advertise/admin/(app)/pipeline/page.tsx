import type { Metadata } from "next";
import { cachedAdvertisers, cachedProspects, cachedVenues } from "@/lib/ads/cached";
import { currentVenue } from "@/lib/ads/current-venue";
import { hasSeveral } from "@/lib/ads/venues";
import { atVenue, prospectsForVenue, summarize, today } from "@/lib/ads/roster";
import { PageHeader } from "../../_components/shell";
import { PipelineFilters, ProspectsTab, type PipelineFilter } from "../../_components/prospects";
import { CategoriesSection, buildCategories } from "../../_components/categories";
import { btnPrimary } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Pipeline" };

const FILTERS: PipelineFilter[] = ["all", "new", "contacted", "review", "won", "passed"];

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; msg?: string; err?: string; detail?: string; clash?: string }>;
}) {
  const [params, prospects, advertisers, venues] = await Promise.all([searchParams, cachedProspects(), cachedAdvertisers(), cachedVenues()]);
  const filter = FILTERS.includes(params.show as PipelineFilter) ? (params.show as PipelineFilter) : "all";
  const asOf = today();
  const venue = await currentVenue(venues);
  const several = hasSeveral(venues);
  // The pipeline is everyone; categories are per location, because that is
  // what exclusivity is.
  const atThisVenue = atVenue(advertisers, venue.id);
  const categories = buildCategories(atThisVenue, prospectsForVenue(prospects, venue.id));
  const summary = summarize(atThisVenue, venue.sellable);
  const locations = venues.filter((v) => v.status !== "ended").map((v) => ({ id: v.id, name: v.name }));

  return (
    <Shell active="pipeline" banner={params}>
      <PageHeader
        eyebrow="Pipeline"
        title="Who's close."
        action={
          <a href="#prospect-add" className={btnPrimary}>
            + Add prospect
          </a>
        }
      />
      <PipelineFilters prospects={prospects} filter={filter} />
      <ProspectsTab prospects={prospects} today={asOf} filter={filter} locations={several ? locations : []} />
      <CategoriesSection rows={categories} openSlots={summary.openSlots} venueName={several ? venue.name : undefined} />
    </Shell>
  );
}
