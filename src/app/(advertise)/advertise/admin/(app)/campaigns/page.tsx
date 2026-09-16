import type { Metadata } from "next";
import { cachedCampaignClients, cachedCampaigns, cachedLinks } from "@/lib/ads/cached";
import { campaignTotals, listAllPlacements, placementFigures, SMART_SCALE_CLIENT_ID } from "@/lib/ads/campaigns";
import { leadsForCodes } from "@/lib/ads/conversions";
import { today } from "@/lib/ads/roster";
import { getStatsForCodes } from "@/lib/ads/scan-store";
import { CampaignFilters, CampaignForm, CampaignList, ClientForm, type CampaignSummary } from "../../_components/campaigns";
import { PageHeader } from "../../_components/shell";
import { btnPrimary } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Campaigns" };

const FILTERS = ["all", "live", "draft", "ended", "ours", "clients"];

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; edit?: string; msg?: string; err?: string; detail?: string }>;
}) {
  const [params, campaigns, clients, links] = await Promise.all([searchParams, cachedCampaigns(), cachedCampaignClients(), cachedLinks()]);
  const filter = FILTERS.includes(params.show ?? "") ? params.show! : "all";
  const clientOf = new Map(clients.map((c) => [c.id, c]));
  const placements = await listAllPlacements(campaigns);
  const linkOf = new Map(links.map((l) => [l.code, l]));

  // Every code across every campaign, counted in one pass.
  const codes = [...placements.values()].flat().map((p) => p.code);
  const [stats, leads] = await Promise.all([getStatsForCodes(codes, 1), leadsForCodes(codes)]);
  const statsOf = new Map(codes.map((c, i) => [c, { stats: stats[i], leads: leads[i] }]));

  const rows: CampaignSummary[] = campaigns.map((campaign) => {
    const theirs = placements.get(campaign.id) ?? [];
    const figures = theirs.map((p) => {
      const s = statsOf.get(p.code);
      return placementFigures(p, s?.stats.total ?? 0, s?.stats.uniqueDevices ?? 0, s?.leads ?? 0);
    });
    const totals = campaignTotals(figures);
    return {
      campaign,
      client: clientOf.get(campaign.clientId) ?? clients[0],
      placements: theirs.length,
      scans: totals.scans,
      leads: totals.leads,
      cost: totals.cost,
      costPerScan: totals.costPerScan,
    };
  });
  void linkOf;

  const shown = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "ours") return r.campaign.clientId === SMART_SCALE_CLIENT_ID;
    if (filter === "clients") return r.campaign.clientId !== SMART_SCALE_CLIENT_ID;
    return r.campaign.status === filter;
  });
  const counts: Record<string, number> = {
    all: rows.length,
    live: rows.filter((r) => r.campaign.status === "live").length,
    draft: rows.filter((r) => r.campaign.status === "draft").length,
    ended: rows.filter((r) => r.campaign.status === "ended").length,
    ours: rows.filter((r) => r.campaign.clientId === SMART_SCALE_CLIENT_ID).length,
    clients: rows.filter((r) => r.campaign.clientId !== SMART_SCALE_CLIENT_ID).length,
  };
  const editing = params.edit ? campaigns.find((c) => c.id === params.edit) : undefined;
  const live = counts.live;
  const totalScans = rows.reduce((sum, r) => sum + r.scans, 0);

  return (
    <Shell active="campaigns" banner={params}>
      <PageHeader
        eyebrow={`Campaigns · ${live} out now · ${totalScans.toLocaleString()} scans all time`}
        title="Every magnet, flyer and card, counted."
        action={
          <a href="#campaign-form" className={btnPrimary}>
            + New campaign
          </a>
        }
      />
      <CampaignFilters filter={filter} counts={counts} />
      <CampaignList rows={shown} filter={filter} />
      <CampaignForm clients={clients} editing={editing} today={today()} error={params.err === "campaign" ? params.detail : undefined} open={rows.length === 0} />
      <ClientForm />
    </Shell>
  );
}
