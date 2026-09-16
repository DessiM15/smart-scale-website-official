import type { Metadata } from "next";
import { listArtwork, isArtworkStoreConfigured } from "@/lib/ads/artwork";
import { listAgreements } from "@/lib/ads/agreements";
import { cachedAdvertisers, cachedLinks, cachedPaymentsByAdvertiser, cachedProspects, cachedVenues } from "@/lib/ads/cached";
import { currentVenue } from "@/lib/ads/current-venue";
import { hasSeveral, venueOf } from "@/lib/ads/venues";
import { isDocumentStoreConfigured, listDocuments } from "@/lib/ads/documents";
import { isEmailConfigured } from "@/lib/ads/email";
import { expectedFor } from "@/lib/ads/expected";
import { linksForAdvertiser } from "@/lib/ads/link-store";
import { agreementUrl, isLinkSigningConfigured } from "@/lib/ads/links";
import { atVenue, categoryConflict, summarize, today, venueIdOf } from "@/lib/ads/roster";
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
    copy?: string;
    msg?: string;
    err?: string;
    detail?: string;
    clash?: string;
  }>;
}) {
  const [params, allAdvertisers, prospects, rawLinks, venues] = await Promise.all([searchParams, cachedAdvertisers(), cachedProspects(), cachedLinks(), cachedVenues()]);
  const venue = await currentVenue(venues);
  const several = hasSeveral(venues);
  // One location's roster at a time once there are two. A client opened by
  // link is shown whichever location is selected, so a link never lands on
  // an empty table.
  const advertisers = several ? atVenue(allAdvertisers, venue.id) : allAdvertisers;
  const asOf = today();
  const filter = FILTERS.includes(params.show as AdvertiserFilter) ? (params.show as AdvertiserFilter) : "all";
  const query = params.q ?? "";
  const panel: ClientPanel = CLIENT_PANELS.some((p) => p.id === params.panel) ? (params.panel as ClientPanel) : "deal";

  const openView = params.open ? allAdvertisers.find((a) => a.id === params.open) : undefined;
  // An opened client is shown whatever the filter says, so a link to them
  // never lands on an empty table.
  const listed = openView && !advertisers.some((a) => a.id === openView.id) ? [openView, ...advertisers] : advertisers;
  const shown = listed.filter((v) => (openView && v.id === openView.id) || (matchesFilter(v, filter) && matchesQuery(v, query)));

  const payments = await cachedPaymentsByAdvertiser(listed.map((a) => a.id));
  const extras = new Map<string, RowExtras>();
  await Promise.all(
    listed.map(async (view) => {
      const theirs = linksForAdvertiser(rawLinks, view.id, view.qrCode);
      const stats = theirs.length ? await getCombinedStats(theirs.map((l) => l.code), 30) : null;
      const schedule = expectedFor(view, payments.get(view.id) ?? [], asOf);
      const next = schedule.find((e) => e.status !== "paid") ?? [...schedule].reverse().find((e) => e.status === "paid");
      extras.set(view.id, { scans30: stats?.windowTotal ?? 0, payment: next, venueName: several ? venueOf(venues, view.venueId).name : undefined });
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
      venue: venueOf(venues, openView.venueId),
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
  const editing = params.edit ? allAdvertisers.find((a) => a.id === params.edit) : undefined;
  const converting = params.from ? prospects.find((p) => p.id === params.from) : undefined;
  const summary = summarize(atVenue(allAdvertisers, venue.id), venue.sellable);
  // A conversion lands on the location the prospect asked about, if it is one
  // that is live; otherwise on the one the portal is looking at.
  const convertingVenue = converting?.venueIds?.map((id) => venueOf(venues, id)).find((v) => v.status === "live") ?? venue;
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
        categoryHeldBy: categoryConflict(allAdvertisers, converting.category, undefined, convertingVenue.id)?.business,
        openSlots: summarize(atVenue(allAdvertisers, convertingVenue.id), convertingVenue.sellable).openSlots,
        venueId: convertingVenue.id,
      }
    : undefined;
  // The same business going on a second location: two rows, by Dessi's
  // call, so the contact details are copied across rather than retyped.
  const copying = params.copy ? allAdvertisers.find((a) => a.id === params.copy) : undefined;
  const copy = copying
    ? {
        fromId: copying.id,
        business: copying.business,
        contactName: copying.contactName,
        email: copying.email,
        phone: copying.phone,
        category: copying.category,
        notes: "",
        fromVenueName: venueOf(venues, copying.venueId).name,
      }
    : undefined;

  const running = advertisers.filter((a) => a.status === "active").length;
  const locationOptions = venues
    .filter((v) => v.status !== "ended")
    .map((v) => ({ id: v.id, name: v.name, live: v.status === "live", sellable: v.sellable }));

  return (
    <Shell active="advertisers" banner={params}>
      <PageHeader
        eyebrow={`Advertisers${several ? ` · ${venue.name}` : ""} · ${running} running · ${summary.openSlots} ${summary.openSlots === 1 ? "slot" : "slots"} open`}
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
        copy={copy}
        query={query}
        locations={locationOptions}
        currentVenueId={venue.id}
        copyCandidates={several ? allAdvertisers.filter((a) => a.status !== "ended" && venueIdOf(a) !== venue.id).map((a) => ({ id: a.id, label: `${a.business} · ${venueOf(venues, a.venueId).name}` })) : []}
      />
    </Shell>
  );
}
