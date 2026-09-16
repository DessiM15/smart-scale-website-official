/**
 * What each location is owed, and whether it has been paid.
 *
 * Rent is fixed and due on the venue's day each month. The share is a cut of
 * money actually collected from that location's advertisers, so it is only
 * known once the month is over, and is due on the venue's day of the month
 * after. Both land on the Today list when due, and logging one from there
 * writes the expense into the books with a reference, so it can never be
 * logged twice and the Locations page can say "paid".
 */

import type { ExpectedPayment } from "./expected";
import { monthBook } from "./expected";
import { addMonths, daysBetween, type AdvertiserView } from "./roster";
import type { Payment } from "./payments";
import { hasDeal, owedForMonth, venueOf, type Venue } from "./venues";
import { sourceStatuses } from "@/lib/books/ledger";

/** Documents (the venue agreement) live under this owner key in the document store. */
export const venueDocumentOwner = (venueId: string) => `venue:${venueId}`;

/** The books' reference for a venue payment, so it posts once. */
export const venueDueRef = (venueId: string, month: string, part: "rent" | "share") => `venue:${venueId}:${month}:${part}`;

export type VenueDue = {
  venueId: string;
  venueName: string;
  ownerName: string;
  /** The month the money is for. */
  month: string;
  rent: number;
  share: number;
  total: number;
  /** When it falls due. Rent: the venue's day in the month itself. Share: the venue's day in the month after. */
  dueDate: string;
  /** Days past due, negative while still ahead. */
  daysLate: number;
  paid: boolean;
  rentPaid: boolean;
  sharePaid: boolean;
};

function dueOn(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}

/**
 * The current month's dues for every location with a deal. The share shown
 * for the current month is "so far"; the one that actually falls due is last
 * month's, which `venueDuesDue` picks out for the Today list.
 */
export async function venueDuesFor(
  venues: Venue[],
  advertisers: AdvertiserView[],
  payments: Map<string, Payment[]>,
  asOf: string,
): Promise<VenueDue[]> {
  const month = asOf.slice(0, 7);
  return duesForMonth(venues, advertisers, payments, month, asOf);
}

async function duesForMonth(
  venues: Venue[],
  advertisers: AdvertiserView[],
  payments: Map<string, Payment[]>,
  month: string,
  asOf: string,
): Promise<VenueDue[]> {
  const withDeal = venues.filter((v) => v.status !== "ended" && hasDeal(v));
  if (withDeal.length === 0) return [];

  const refs = withDeal.flatMap((v) => [venueDueRef(v.id, month, "rent"), venueDueRef(v.id, month, "share")]);
  const marks = await sourceStatuses(refs);

  return withDeal.map((venue) => {
    const theirs = advertisers.filter((a) => venueOf(venues, a.venueId).id === venue.id);
    const book = monthBook(theirs, payments, month, asOf);
    const owed = owedForMonth(venue, book.collected);
    const rentPaid = Boolean(marks.get(venueDueRef(venue.id, month, "rent")));
    const sharePaid = Boolean(marks.get(venueDueRef(venue.id, month, "share")));
    // Rent is due in its own month; the share, being on collections, the month after.
    const dueDate = owed.rent > 0 ? dueOn(month, venue.deal.dueDay) : dueOn(addMonths(`${month}-01`, 1).slice(0, 7), venue.deal.dueDay);
    return {
      venueId: venue.id,
      venueName: venue.name,
      ownerName: venue.ownerName,
      month,
      rent: owed.rent,
      share: owed.share,
      total: owed.total,
      dueDate,
      daysLate: daysBetween(dueDate, asOf),
      paid: (owed.rent === 0 || rentPaid) && (owed.share === 0 || sharePaid),
      rentPaid,
      sharePaid,
    };
  });
}

export type VenueDueRow = {
  key: string;
  venueId: string;
  venueName: string;
  ownerName: string;
  month: string;
  part: "rent" | "share";
  amount: number;
  dueDate: string;
  daysLate: number;
};

/**
 * The venue payments that have fallen due and are not in the books: this
 * month's rent from its due day, and last month's share from the due day
 * after the month closed. One row each, so Today can show and log them.
 */
export async function venueDuesDue(
  venues: Venue[],
  advertisers: AdvertiserView[],
  payments: Map<string, Payment[]>,
  asOf: string,
): Promise<VenueDueRow[]> {
  const month = asOf.slice(0, 7);
  const previous = addMonths(`${month}-01`, -1).slice(0, 7);
  const [thisMonth, lastMonth] = await Promise.all([
    duesForMonth(venues, advertisers, payments, month, asOf),
    duesForMonth(venues, advertisers, payments, previous, asOf),
  ]);

  const rows: VenueDueRow[] = [];
  for (const d of thisMonth) {
    if (d.rent > 0 && !d.rentPaid) {
      const dueDate = dueOn(month, venueDayOf(venues, d.venueId));
      if (dueDate <= asOf) rows.push(row(d, "rent", d.rent, dueDate, asOf));
    }
  }
  for (const d of lastMonth) {
    if (d.share > 0 && !d.sharePaid) {
      const dueDate = dueOn(month, venueDayOf(venues, d.venueId));
      if (dueDate <= asOf) rows.push(row(d, "share", d.share, dueDate, asOf));
    }
    if (d.rent > 0 && !d.rentPaid) {
      // Last month's rent still unpaid stays on the list until it is logged.
      rows.push(row(d, "rent", d.rent, dueOn(previous, venueDayOf(venues, d.venueId)), asOf));
    }
  }
  return rows.sort((a, b) => b.daysLate - a.daysLate);
}

function venueDayOf(venues: Venue[], id: string): number {
  return venues.find((v) => v.id === id)?.deal.dueDay ?? 1;
}

function row(d: VenueDue, part: "rent" | "share", amount: number, dueDate: string, asOf: string): VenueDueRow {
  return {
    key: `venuedue:${d.venueId}:${d.month}:${part}`,
    venueId: d.venueId,
    venueName: d.venueName,
    ownerName: d.ownerName,
    month: d.month,
    part,
    amount,
    dueDate,
    daysLate: daysBetween(dueDate, asOf),
  };
}

/** Collections for one location in one month, for the payments page tiles. */
export function collectedForVenue(venues: Venue[], venueId: string, advertisers: AdvertiserView[], rows: ExpectedPayment[]): number {
  const ids = new Set(advertisers.filter((a) => venueOf(venues, a.venueId).id === venueId).map((a) => a.id));
  return Math.round(rows.filter((r) => r.status === "paid" && ids.has(r.advertiserId)).reduce((sum, r) => sum + r.amount, 0) * 100) / 100;
}
