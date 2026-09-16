import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cachedCampaignClients, cachedCampaigns, cachedLinks } from "@/lib/ads/cached";
import { getCampaign, listAllPlacements, listPlacements, placementFigures, mediumOf } from "@/lib/ads/campaigns";
import { leadsForCodes, recentConversions } from "@/lib/ads/conversions";
import { getStatsForCodes } from "@/lib/ads/scan-store";
import { spentOnCampaign } from "@/lib/books/campaign-costs";
import { CAMPAIGNS, CampaignDetail, CampaignHeader, type PlacementRow } from "../../../_components/campaigns";
import { PageHeader } from "../../../_components/shell";
import { btnGhost } from "../../../_components/ui";
import { Shell } from "../../shell";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [campaign, clients, links, campaigns] = await Promise.all([getCampaign(id), cachedCampaignClients(), cachedLinks(), cachedCampaigns()]);
  if (!campaign) notFound();

  const client = clients.find((c) => c.id === campaign.clientId) ?? clients[0];
  const placements = await listPlacements(campaign.id);
  const codes = placements.map((p) => p.code);
  const [stats, leads, recent, spent] = await Promise.all([
    getStatsForCodes(codes, 1),
    leadsForCodes(codes),
    Promise.all(codes.map((c) => recentConversions(c))),
    spentOnCampaign(campaign.id),
  ]);
  const linkOf = new Map(links.map((l) => [l.code, l]));

  const rows: PlacementRow[] = placements.map((p, i) => ({
    ...placementFigures(p, stats[i]?.total ?? 0, stats[i]?.uniqueDevices ?? 0, leads[i] ?? 0),
    link: linkOf.get(p.code) ?? null,
    testScans: stats[i]?.testScans ?? 0,
    recentLeads: recent[i] ?? [],
  }));

  // Codes not yet in any campaign, for attaching something already printed.
  const everywhere = await listAllPlacements(campaigns);
  const used = new Set([...everywhere.values()].flat().map((p) => p.code));
  const freeCodes = links.filter((l) => !used.has(l.code));

  return (
    <Shell active="campaigns" banner={query}>
      <PageHeader
        eyebrow={`${client.name} · ${mediumOf(campaign.medium).label}`}
        title={campaign.name}
        action={
          <a href={CAMPAIGNS} className={btnGhost}>
            All campaigns
          </a>
        }
      />
      <CampaignHeader campaign={campaign} client={client} rows={rows} spentInBooks={spent} />
      <CampaignDetail campaign={campaign} client={client} rows={rows} freeCodes={freeCodes} msg={query.msg} />
    </Shell>
  );
}
