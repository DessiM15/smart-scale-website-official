/**
 * Per-request memoised reads.
 *
 * The shell needs the same roster the page needs, for the counts in the
 * sidebar. Without this, every navigation would read the roster twice. React's
 * `cache` scopes the memo to one server render, so nothing here is ever stale
 * across requests; it only stops the same request asking Redis the same
 * question twice.
 */

import { cache } from "react";
import { listAdvertisers, listProspects } from "./roster";
import { listReports } from "./reports";
import { listLinks } from "./link-store";
import { listResponses } from "./responses";
import { listTasks } from "./tasks";
import { listPayments } from "./payments";
import { listEntries, listMonths } from "@/lib/books/ledger";
import { listPendingReceipts } from "@/lib/books/receipts";
import { listBills } from "@/lib/books/recurring";
import { listClients } from "@/lib/books/clients";

export const cachedAdvertisers = cache(listAdvertisers);
export const cachedProspects = cache(listProspects);
export const cachedReports = cache(listReports);
export const cachedLinks = cache(listLinks);
export const cachedResponses = cache(listResponses);
export const cachedTasks = cache(listTasks);

/* The books. Read by the Today list, the sidebar counts and the Books pages. */
export const cachedEntries = cache(listEntries);
export const cachedMonths = cache(listMonths);
export const cachedPendingReceipts = cache(listPendingReceipts);
export const cachedBills = cache(listBills);
export const cachedClients = cache(listClients);

/**
 * Every client's full payment history, keyed by client.
 *
 * `cache` compares arguments by identity, and two arrays are never the same
 * array, so the ids travel as one joined string.
 */
const paymentsByKey = cache(async (joined: string) => {
  const ids = joined ? joined.split("\u0000") : [];
  const lists = await Promise.all(ids.map((id) => listPayments(id)));
  const map = new Map<string, Awaited<ReturnType<typeof listPayments>>>();
  ids.forEach((id, i) => map.set(id, lists[i]));
  return map;
});

export const cachedPaymentsByAdvertiser = (ids: string[]) => paymentsByKey([...ids].sort().join("\u0000"));
