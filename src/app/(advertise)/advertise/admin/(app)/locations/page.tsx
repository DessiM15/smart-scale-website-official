import type { Metadata } from "next";
import { cachedAdvertisers, cachedPaymentsByAdvertiser, cachedVenues } from "@/lib/ads/cached";
import { listDocuments } from "@/lib/ads/documents";
import { monthBook } from "@/lib/ads/expected";
import { today } from "@/lib/ads/roster";
import { venueDocumentOwner, venueDuesFor } from "@/lib/ads/venue-dues";
import { newVenueDefaults } from "@/lib/ads/venues";
import { PageHeader } from "../../_components/shell";
import { LocationForm, LocationsList, type LocationView } from "../../_components/locations";
import { btnPrimary } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Locations" };

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; msg?: string; err?: string; detail?: string }>;
}) {
  const [params, venues, advertisers] = await Promise.all([searchParams, cachedVenues(), cachedAdvertisers()]);
  const asOf = today();
  const month = asOf.slice(0, 7);
  const payments = await cachedPaymentsByAdvertiser(advertisers.map((a) => a.id));
  const dues = await venueDuesFor(venues, advertisers, payments, asOf);

  const rows: LocationView[] = await Promise.all(
    venues.map(async (venue) => {
      const theirs = advertisers.filter((a) => (a.venueId ?? venues[0].id) === venue.id);
      const running = theirs.filter((a) => a.status === "active").length;
      const book = monthBook(theirs, payments, month, asOf);
      const due = dues.find((d) => d.venueId === venue.id);
      return {
        venue,
        running,
        pending: theirs.filter((a) => a.status === "pending").length,
        openSlots: Math.max(0, venue.sellable - running),
        owed: {
          month,
          collected: book.collected,
          rent: due?.rent ?? 0,
          share: due?.share ?? 0,
          total: due?.total ?? 0,
          dueDate: due?.dueDate ?? "",
          paid: due?.paid ?? false,
        },
        documents: await listDocuments(venueDocumentOwner(venue.id)),
      };
    }),
  );

  const editing = params.edit ? venues.find((v) => v.id === params.edit) : undefined;
  const live = venues.filter((v) => v.status === "live").length;

  return (
    <Shell active="locations" banner={params}>
      <PageHeader
        eyebrow={`Locations · ${live} live${venues.length > live ? ` · ${venues.length - live} other` : ""}`}
        title="Where the screens are."
        action={
          <a href="#editor" className={btnPrimary}>
            + Add location
          </a>
        }
      />
      <LocationsList rows={rows} />
      <LocationForm editing={editing} blank={newVenueDefaults()} error={params.err === "venue" ? params.detail : undefined} />
    </Shell>
  );
}
