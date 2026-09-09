import type { Metadata } from "next";
import { listArtwork, isArtworkStoreConfigured } from "@/lib/ads/artwork";
import { listAgreements } from "@/lib/ads/agreements";
import { cachedAdvertisers, cachedLinks, cachedPaymentsByAdvertiser, cachedProspects } from "@/lib/ads/cached";
import { isDocumentStoreConfigured, listDocuments } from "@/lib/ads/documents";
import { isEmailConfigured } from "@/lib/ads/email";
import { expectedFor } from "@/lib/ads/expected";
import { linksForAdvertiser } from "@/lib/ads/link-store";
import { agreementUrl, isLinkSigningConfigured } from "@/lib/ads/links";
import { categoryConflict, summarize, today } from "@/lib/ads/roster";
import { getCodeStats, getCombinedStats } from "@/lib/ads/scan-store";
import { PageHeader } from "../../_components/shell";
import { AdvertiserFilters, AdvertisersTab, matchesFilter, matchesQuery, type AdvertiserFilter, type RowExtras } from "../../_components/advertisers";
import { CLIENT_PANELS, type ClientData, type ClientPanel } from "../../_components/client-detail";
import type { LinkView } from "../../_components/types";
import { btnPrimary } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Advertisers" };

const FILTERS: AdvertiserFilter[] = ["all", "active", "pending", "ending", "ended", "artwork"];

export default async function AdvertisersPage({
  searchParams,
}: {
  searchParams: Promise<{
    show?: string;
    q?: string;
    open?: string;
    panel?: string;
    edit?: string;
    from?: string;
    msg?: string;
    err?: string;
    detail?: string;
    clash?: string;
  }>;
}) {
  const [params, advertisers, prospects, rawLinks] = await Promise.all([searchParams, cachedAdvertisers(), cachedProspects(), cachedLinks()]);
  const asOf = today();
  const filter = FILTERS.includes(params.show as AdvertiserFilter) ? (params.show as AdvertiserFilter) : "all";
  const query = params.q ?? "";
  const panel: ClientPanel = CLIENT_PANELS.some((p) => p.id === params.panel) ? (params.panel as ClientPanel) : "deal";

  const openView = params.open ? advertisers.find((a) => a.id === params.open) : undefined;
  // An opened client is shown whatever the filter says, so a link to them
  // never lands on an empty table.
  const shown = advertisers.filter((v) => (openView && v.id === openView.id) || (matchesFilter(v, filter) && matchesQuery(v, query)));

  const payments = await cachedPaymentsByAdvertiser(advertisers.map((a) => a.id));
  const extras = new Map<string, RowExtras>();
  await Promise.all(
    advertisers.map(async (view) => {
      const theirs = linksForAdvertiser(rawLinks, view.id, view.qrCode);
      const stats = theirs.length ? await getCombinedStats(theirs.map((l) => l.code), 30) : null;
      const schedule = expectedFor(view, payments.get(view.id) ?? [], asOf);
      const next = schedule.find((e) => e.status !== "paid") ?? [...schedule].reverse().find((e) => e.status === "paid");
      extras.set(view.id, { scans30: stats?.windowTotal ?? 0, payment: next });
    }),
  );

  let client: ClientData | undefined;
  if (openView) {
    const theirs = linksForAdvertiser(rawLinks, openView.id, openView.qrCode);
    const [codes, artwork, agreements, documents] = await Promise.all([
      Promise.all(theirs.map(async (link) => ({ link, stats: await getCodeStats(link.code, 30) }))),
      listArtwork(openView.id),
      listAgreements(openView.id),
      listDocuments(openView.id),
    ]);
    const signUrls: Record<string, string | null> = {};
    for (const agreement of agreements) signUrls[agreement.id] = agreementUrl(agreement.id);
    client = {
      view: openView,
      codes,
      artwork,
      agreements,
      documents,
      payments: payments.get(openView.id) ?? [],
      signUrls,
      emailConfigured: isEmailConfigured(),
      signingConfigured: isLinkSigningConfigured(),
      storageConfigured: isArtworkStoreConfigured() && isDocumentStoreConfigured(),
    };
  }

  const links: LinkView[] = rawLinks.map((link) => ({ ...link, scans: 0, testScans: 0 }));
  const knownCodes = new Set(rawLinks.map((l) => l.code));
  const editing = params.edit ? advertisers.find((a) => a.id === params.edit) : undefined;
  const converting = params.from ? prospects.find((p) => p.id === params.from) : undefined;
  const summary = summarize(advertisers);
  const prefill = converting
    ? {
        prospectId: converting.id,
        business: converting.business,
        contactName: converting.contactName,
        email: converting.email,
        phone: converting.phone,
        category: converting.category,
        notes: converting.notes,
        campaign: converting.campaign ?? "",
        source: converting.source,
        categoryHeldBy: categoryConflict(advertisers, converting.category)?.business,
        openSlots: summary.openSlots,
      }
    : undefined;

  const running = advertisers.filter((a) => a.status === "active").length;

  return (
    <Shell active="advertisers" banner={params}>
      <PageHeader
        eyebrow={`Advertisers · ${running} running · ${summary.openSlots} ${summary.openSlots === 1 ? "slot" : "slots"} open`}
        title="On the screens."
        action={
          <a href="#editor" className={btnPrimary}>
            + Add advertiser
          </a>
        }
      />
      <AdvertiserFilters advertisers={advertisers} filter={filter} query={query} />
      <AdvertisersTab
        advertisers={advertisers}
        shown={shown}
        extras={extras}
        open={openView?.id}
        client={client}
        panel={panel}
        knownCodes={knownCodes}
        links={links}
        editing={editing}
        prefill={prefill}
        query={query}
      />
    </Shell>
  );
}
