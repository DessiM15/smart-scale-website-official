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
import { listVault } from "./vault";
import { getCompany } from "./company";
import { listPasskeys } from "./passkeys";

export async function exportBooks() {
  const [entries, receipts, clients, bills, vault, company, passkeys] = await Promise.all([
    listAllEntries(),
    listAllReceipts(),
    listClients(),
    listBills(),
    listVault(),
    getCompany(),
    listPasskeys(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    entries,
    receipts: receipts.map(({ blobUrl, ...rest }) => ({ ...rest, blobPath: blobUrl.split("/").slice(3).join("/") })),
    clients,
    bills,
    // Sealed files stay sealed; the record is what is needed to find them again.
    vault: vault.map(({ blobUrl, ...rest }) => ({ ...rest, blobPath: blobUrl.split("/").slice(3).join("/") })),
    // The EIN is stored sealed, so it travels sealed.
    company,
    // Public keys only. Without these a restored database would lock everyone out.
    passkeys,
  };
}
