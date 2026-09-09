/**
 * The Board: every slide in the rotation and who is in it.
 *
 * Sixteen sellable slots plus the venue's own two, laid out as a grid so the
 * state of the rotation reads in a glance. Each client carries a slot number;
 * anyone saved before slots existed is placed in the lowest free one for
 * display and keeps that placing until somebody saves them with a number.
 */

import {
  artworkStatusOf,
  isOpenProspect,
  type AdvertiserView,
  type Prospect,
} from "./roster";
import { venueOf, type Venue } from "./venues";

export type SlotState = "active" | "expiring" | "pending" | "house" | "open";

export type BoardSlot = {
  number: number;
  state: SlotState;
  /** The business in it, or "Open". */
  name: string;
  /** One line under the name: category and end date, days left, who is waiting. */
  detail: string;
  advertiserId?: string;
  /** For an open slot: the first prospect asking for a category nobody holds. */
  waitingProspectId?: string;
  /** Their slide is not on the screens yet, whatever the slot says. */
  artworkPending?: boolean;
};

export type Board = {
  venue: Venue;
  slots: BoardSlot[];
  counts: Record<SlotState, number>;
};

/**
 * Lowest free slot number, for a client who has none.
 *
 * Used both when saving a record and when laying out the Board, so what is
 * shown before a save matches what the save would write.
 */
export function lowestFreeSlot(taken: Iterable<number | null | undefined>, sellable: number): number | null {
  const used = new Set<number>();
  for (const n of taken) if (typeof n === "number" && n >= 1) used.add(n);
  for (let i = 1; i <= sellable; i += 1) if (!used.has(i)) return i;
  return null;
}

export function buildBoard(
  views: AdvertiserView[],
  prospects: Prospect[],
  venueId?: string,
): Board {
  const venue = venueOf(venueId);
  const onBoard = views.filter((v) => v.status === "active" || v.status === "pending");

  // Fixed slots first, then the unplaced take whatever is left, running
  // clients before signed ones so the people paying now are never bumped.
  const placed = new Map<number, AdvertiserView>();
  for (const v of onBoard) {
    if (typeof v.slot === "number" && v.slot >= 1 && v.slot <= venue.sellable && !placed.has(v.slot)) {
      placed.set(v.slot, v);
    }
  }
  const unplaced = onBoard
    .filter((v) => ![...placed.values()].includes(v))
    .sort((a, b) => (a.status === b.status ? a.startDate.localeCompare(b.startDate) : a.status === "active" ? -1 : 1));
  for (const v of unplaced) {
    const n = lowestFreeSlot(placed.keys(), venue.sellable);
    if (n === null) break;
    placed.set(n, v);
  }

  // Categories nobody active holds, with the prospect who asked first.
  const held = new Set(views.filter((v) => v.status === "active").map((v) => v.category.trim().toLowerCase()).filter(Boolean));
  const waiting = prospects
    .filter((p) => isOpenProspect(p) && p.category.trim() && !held.has(p.category.trim().toLowerCase()))
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt));
  const seenCategory = new Set<string>();
  const waitingQueue = waiting.filter((p) => {
    const key = p.category.trim().toLowerCase();
    if (seenCategory.has(key)) return false;
    seenCategory.add(key);
    return true;
  });

  const slots: BoardSlot[] = [];
  const counts: Record<SlotState, number> = { active: 0, expiring: 0, pending: 0, house: 0, open: 0 };

  for (let n = 1; n <= venue.sellable; n += 1) {
    const v = placed.get(n);
    if (!v) {
      const next = waitingQueue.shift();
      slots.push({
        number: n,
        state: "open",
        name: "Open",
        detail: next ? `${next.category} waiting` : "",
        waitingProspectId: next?.id,
      });
      counts.open += 1;
      continue;
    }
    const state: SlotState = v.status === "pending" ? "pending" : v.expiringSoon || v.overdue ? "expiring" : "active";
    counts[state] += 1;
    slots.push({
      number: n,
      state,
      name: v.business,
      detail:
        v.status === "pending"
          ? `${v.category || "no category"} · starts ${shortDate(v.startDate)}`
          : v.overdue
            ? `${v.category || "no category"} · ended ${shortDate(v.endDate)}`
            : v.expiringSoon
              ? `${v.category || "no category"} · ${v.daysRemaining} days`
              : `${v.category || "no category"} · ${shortDate(v.endDate)}`,
      advertiserId: v.id,
      artworkPending: artworkStatusOf(v) !== "on-screen",
    });
  }

  for (let n = venue.sellable + 1; n <= venue.slides; n += 1) {
    slots.push({ number: n, state: "house", name: venue.name, detail: "House slide" });
    counts.house += 1;
  }

  return { venue, slots, counts };
}

function shortDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
