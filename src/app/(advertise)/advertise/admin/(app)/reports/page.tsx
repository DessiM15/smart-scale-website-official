import type { Metadata } from "next";
import { generateReportsAction, setAutoSendReportsAction } from "../../actions";
import { getSettings } from "@/lib/ads/settings";
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
  const [params, reports, advertisers, venues, settings] = await Promise.all([searchParams, cachedReports(), cachedAdvertisers(), cachedVenues(), getSettings()]);
  const auto = settings.autoSendReports;
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
      <form action={setAutoSendReportsAction} className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-white">
            Automatic sending is {auto ? "on" : "off"}.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            {auto
              ? "On the 1st each draft is previewed to the team inbox; on the 2nd it goes to the client unless you skip it here. Drafts whose figures no longer match the roster are held for you."
              : "Drafts appear on the 1st and wait here. Nothing reaches a client until you press Send on it."}
          </p>
        </div>
        <input type="hidden" name="on" value={auto ? "0" : "1"} />
        <SubmitButton className={btnPrimary} pendingLabel="Saving">
          {auto ? "Turn automatic sending off" : "Turn automatic sending on"}
        </SubmitButton>
      </form>
      <ReportsTab reports={reports} advertisers={advertisers} venues={venues} />
    </Shell>
  );
}
