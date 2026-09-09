/**
 * Ad payments post into the ledger.
 *
 * The ads side records that an advertiser paid; the books need the same fact
 * as income. Rather than two places that drift, every ad payment writes one
 * ledger row keyed to the payment's id, and removing the payment removes the
 * row. Nothing is ever posted twice, because the reference is the guard.
 */

import type { Payment } from "@/lib/ads/payments";
import { ensureClientForAdvertiser } from "./clients";
import { addEntry, deleteEntry, entryBySource, type Account, type Entry } from "./ledger";

export const adPaymentRef = (paymentId: string) => `ads:payment:${paymentId}`;

function accountFor(method: Payment["method"]): Account {
  if (method === "stripe") return "stripe";
  if (method === "cash") return "cash";
  return "checking";
}

/** One ledger row for one ad payment. Returns the row, new or already there. */
export async function postAdPayment(payment: Payment, who: string): Promise<Entry | null> {
  const client = await ensureClientForAdvertiser(payment.advertiserId, payment.business);
  const result = await addEntry({
    date: payment.receivedOn,
    cents: Math.round(payment.amount * 100),
    kind: "income",
    category: "ad-revenue",
    account: accountFor(payment.method),
    party: payment.business,
    clientId: client?.id,
    memo: [payment.period ? `Screen ad, ${payment.period}` : "Screen ad", payment.reference, payment.note].filter(Boolean).join(" · "),
    who,
    source: "ads",
    sourceRef: adPaymentRef(payment.id),
    noReceipt: true,
  });
  return result.ok ? result.entry : null;
}

export async function unpostAdPayment(paymentId: string): Promise<void> {
  const entry = await entryBySource(adPaymentRef(paymentId));
  if (entry) await deleteEntry(entry.id);
}

/** Ad payments the ledger has never seen, so the two can be brought level. */
export async function unpostedAdPayments(payments: Payment[]): Promise<Payment[]> {
  const out: Payment[] = [];
  for (const p of payments) {
    if (!(await entryBySource(adPaymentRef(p.id)))) out.push(p);
  }
  return out;
}
