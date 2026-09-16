import type { Metadata } from "next";
import { generateReportsAction } from "../../actions";
import { cachedAdvertisers, cachedReports, cachedVenues } from "@/lib/ads/cached";
import { PageHeader } from "../../_components/shell";
import { ReportsTab } from "../../_components/reports";
import { SubmitButton } from "../../_components/submit-button";
import { btnPrimary } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string; sent?: string; checked?: string }>;
}) {
  const [params, reports, advertisers, venues] = await Promise.all([searchParams, cachedReports(), cachedAdvertisers(), cachedVenues()]);
  const drafts = reports.filter((r) => r.status === "draft").length;

  return (
    <Shell active="reports" banner={params}>
      <PageHeader
        eyebrow={`Reports${drafts ? ` · ${drafts} waiting` : ""}`}
        title="What each client hears from you."
        action={
          <form action={generateReportsAction}>
            <SubmitButton className={btnPrimary} pendingLabel="Drafting">
              Draft last month now
            </SubmitButton>
          </form>
        }
      />
      <ReportsTab reports={reports} advertisers={advertisers} venues={venues} />
    </Shell>
  );
}
