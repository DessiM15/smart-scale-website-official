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
import { addEntry, deleteEntry, entryBySource, ignoreSource, sourceStatus, unignoreSource, type Account, type Entry } from "./ledger";

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

export type AdPaymentState = { payment: Payment; state: "posted"; entry: Entry } | { payment: Payment; state: "left-out"; reason: string } | { payment: Payment; state: "waiting" };

/** Every ad payment and what the books did with it, newest first. */
export async function adPaymentStates(payments: Payment[]): Promise<AdPaymentState[]> {
  const out: AdPaymentState[] = [];
  for (const payment of payments) {
    const status = await sourceStatus(adPaymentRef(payment.id));
    if (status?.kind === "entry") out.push({ payment, state: "posted", entry: status.entry });
    else if (status?.kind === "ignored") out.push({ payment, state: "left-out", reason: status.reason });
    else out.push({ payment, state: "waiting" });
  }
  return out.sort((a, b) => b.payment.receivedOn.localeCompare(a.payment.receivedOn));
}

/** Ad payments the ledger has never seen and nobody has left out. */
export async function unpostedAdPayments(payments: Payment[]): Promise<Payment[]> {
  return (await adPaymentStates(payments)).filter((s) => s.state === "waiting").map((s) => s.payment);
}

/** Money that was never the LLC's: paid before it existed, or to a personal account. */
export async function leaveOutAdPayment(paymentId: string, reason: string): Promise<boolean> {
  return ignoreSource(adPaymentRef(paymentId), reason || "not business money");
}

export async function bringBackAdPayment(paymentId: string): Promise<boolean> {
  return unignoreSource(adPaymentRef(paymentId));
}
