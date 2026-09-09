/**
 * The books as one JSON object, for the nightly backup.
 *
 * Everything needed to rebuild the ledger without the database: every row,
 * every receipt's record (the photo itself is already in the file store),
 * the clients and the bills. Restoring is reading the JSON.
 */

import { listClients } from "./clients";
import { listAllEntries } from "./ledger";
import { listAllReceipts } from "./receipts";
import { listBills } from "./recurring";

export async function exportBooks() {
  const [entries, receipts, clients, bills] = await Promise.all([
    listAllEntries(),
    listAllReceipts(),
    listClients(),
    listBills(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    entries,
    receipts: receipts.map(({ blobUrl, ...rest }) => ({ ...rest, blobPath: blobUrl.split("/").slice(3).join("/") })),
    clients,
    bills,
  };
}
