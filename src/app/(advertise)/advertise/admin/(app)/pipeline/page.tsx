import type { Metadata } from "next";
import { cachedAdvertisers, cachedProspects } from "@/lib/ads/cached";
import { summarize, today } from "@/lib/ads/roster";
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
  const [params, prospects, advertisers] = await Promise.all([searchParams, cachedProspects(), cachedAdvertisers()]);
  const filter = FILTERS.includes(params.show as PipelineFilter) ? (params.show as PipelineFilter) : "all";
  const asOf = today();
  const categories = buildCategories(advertisers, prospects);
  const summary = summarize(advertisers);

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
      <ProspectsTab prospects={prospects} today={asOf} filter={filter} />
      <CategoriesSection rows={categories} openSlots={summary.openSlots} />
    </Shell>
  );
}
