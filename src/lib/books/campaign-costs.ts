/**
 * What a campaign cost, read from the books.
 *
 * The printer's invoice is logged once, in the ledger, tagged with the
 * campaign. The campaign page reads the total back rather than asking for
 * the figure a second time, so the number on the cost-per-scan line is the
 * same number the accountant sees.
 */

import { listAllEntries, type Entry } from "./ledger";

/** Expense rows tagged with this campaign, newest first. */
export async function costsForCampaign(campaignId: string): Promise<Entry[]> {
  if (!campaignId) return [];
  const all = await listAllEntries();
  return all.filter((e) => e.campaignId === campaignId && e.kind === "expense");
}

/** Dollars spent on a campaign, from the books. Zero when nothing is logged. */
export async function spentOnCampaign(campaignId: string): Promise<number> {
  const rows = await costsForCampaign(campaignId);
  return Math.round(rows.reduce((sum, e) => sum + e.cents, 0)) / 100;
}
