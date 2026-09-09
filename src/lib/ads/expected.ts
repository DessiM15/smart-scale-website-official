/**
 * What each client is expected to pay, and when.
 *
 * `payments.ts` records money that arrived. This is the other half: the
 * schedule the deal implies, worked out from the contract every time rather
 * than stored, so a change to the deal changes what is expected without a
 * migration. Payments are allocated against the schedule oldest-first, which
 * is how a bookkeeper would do it and means nothing here depends on a payment
 * having been tagged with the month it was for.
 */

import {
  addMonths,
  daysBetween,
  today,
  type AdvertiserView,
} from "./roster";
import type { Payment } from "./payments";

export type ExpectedStatus = "paid" | "scheduled" | "due" | "late";

export type ExpectedPayment = {
  advertiserId: string;
  business: string;
  /** YYYY-MM the payment covers. */
  period: string;
  /** YYYY-MM-DD it falls due. */
  dueDate: string;
  amount: number;
  /** "Month 3 of 6", "Whole term", "First month + setup". */
  label: string;
  status: ExpectedStatus;
  /** Set once a payment covers it. */
  paidOn?: string;
  paidWith?: Payment["method"];
  /** How far past due, in days. Zero unless late or due. */
  daysLate: number;
};

/** A payment that has fallen due is "due" for this many days before it is late. */
const GRACE_DAYS = 5;

/**
 * The schedule one client's deal implies, before any money is applied.
 *
 * A whole-term price is one payment in the first month. A monthly deal is one
 * payment per month of the term, with the setup fee on the first. Ended clients
 * keep their schedule so old months still add up.
 */
export function scheduleFor(view: AdvertiserView): Omit<ExpectedPayment, "status" | "daysLate">[] {
  if (view.termValue <= 0) return [];

  const upFront = view.soldAsTotal || view.paymentType === "prepaid";
  if (upFront) {
    return [
      {
        advertiserId: view.id,
        business: view.business,
        period: view.startDate.slice(0, 7),
        dueDate: view.startDate,
        amount: round(view.termValue),
        label: "Whole term",
      },
    ];
  }

  const out: Omit<ExpectedPayment, "status" | "daysLate">[] = [];
  for (let i = 0; i < view.months; i += 1) {
    const dueDate = addMonths(view.startDate, i);
    const amount = view.monthly + (i === 0 ? view.setup : 0);
    if (amount <= 0) continue;
    out.push({
      advertiserId: view.id,
      business: view.business,
      period: dueDate.slice(0, 7),
      dueDate,
      amount: round(amount),
      label:
        i === 0 && view.setup > 0
          ? `Month 1 of ${view.months} + setup`
          : `Month ${i + 1} of ${view.months}`,
    });
  }
  return out;
}

/**
 * The schedule with payments applied.
 *
 * Money is applied oldest-first until it runs out. A payment carrying a
 * `period` is applied to that month first, so "Mark paid" on September lands
 * on September even when an older month is still open; anything untagged fills
 * the earliest gap. Partial coverage leaves an expected payment unpaid, which
 * is the conservative reading.
 */
export function applyPayments(
  schedule: Omit<ExpectedPayment, "status" | "daysLate">[],
  payments: Payment[],
  asOf = today(),
): ExpectedPayment[] {
  const ordered = [...schedule].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const byDate = [...payments].sort((a, b) => a.receivedOn.localeCompare(b.receivedOn));

  const covered = new Map<string, Payment>();
  const pool: Payment[] = [];

  // Tagged payments first: they say what they were for.
  for (const p of byDate) {
    const target = p.period ? ordered.find((e) => e.period === p.period && !covered.has(e.period)) : undefined;
    if (target && p.amount + 0.01 >= target.amount) covered.set(target.period, p);
    else pool.push(p);
  }

  // Everything else fills the earliest gaps, cents carried forward. The
  // payment named on a row is the one whose arrival completed it.
  let carried = 0;
  let next = 0;
  let last: Payment | undefined;
  for (const e of ordered) {
    if (covered.has(e.period)) continue;
    while (carried + 0.01 < e.amount && next < pool.length) {
      carried += pool[next].amount;
      last = pool[next];
      next += 1;
    }
    if (carried + 0.01 >= e.amount && last) {
      carried -= e.amount;
      covered.set(e.period, last);
    } else {
      break;
    }
  }

  return ordered.map((e) => {
    const paidBy = covered.get(e.period);
    if (paidBy) {
      return { ...e, status: "paid", paidOn: paidBy.receivedOn, paidWith: paidBy.method, daysLate: 0 };
    }
    const late = daysBetween(e.dueDate, asOf);
    if (late < 0) return { ...e, status: "scheduled", daysLate: 0 };
    if (late <= GRACE_DAYS) return { ...e, status: "due", daysLate: late };
    return { ...e, status: "late", daysLate: late };
  });
}

/** One client's whole schedule, statuses applied. */
export function expectedFor(view: AdvertiserView, payments: Payment[], asOf = today()): ExpectedPayment[] {
  return applyPayments(scheduleFor(view), payments, asOf);
}

export type MonthBook = {
  month: string;
  rows: ExpectedPayment[];
  expected: number;
  collected: number;
  outstanding: number;
  counts: Record<ExpectedStatus, number>;
};

/**
 * Every expected payment falling in one month, across every client, with
 * what has been collected against them.
 *
 * `paymentsByAdvertiser` must hold each client's complete payment history, not
 * just the month's, because allocation is oldest-first across the whole term.
 */
export function monthBook(
  views: AdvertiserView[],
  paymentsByAdvertiser: Map<string, Payment[]>,
  month: string,
  asOf = today(),
): MonthBook {
  const rows: ExpectedPayment[] = [];
  for (const view of views) {
    const all = expectedFor(view, paymentsByAdvertiser.get(view.id) ?? [], asOf);
    for (const e of all) if (e.period === month) rows.push(e);
  }
  rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.business.localeCompare(b.business));

  const counts: Record<ExpectedStatus, number> = { paid: 0, scheduled: 0, due: 0, late: 0 };
  let expected = 0;
  let collected = 0;
  for (const r of rows) {
    counts[r.status] += 1;
    expected += r.amount;
    if (r.status === "paid") collected += r.amount;
  }
  return {
    month,
    rows,
    expected: round(expected),
    collected: round(collected),
    outstanding: round(expected - collected),
    counts,
  };
}

/** Expected payments that have fallen due and are not covered, oldest first. */
export function overdueAcross(
  views: AdvertiserView[],
  paymentsByAdvertiser: Map<string, Payment[]>,
  asOf = today(),
): ExpectedPayment[] {
  const out: ExpectedPayment[] = [];
  for (const view of views) {
    if (view.status === "ended") continue;
    for (const e of expectedFor(view, paymentsByAdvertiser.get(view.id) ?? [], asOf)) {
      if (e.status === "due" || e.status === "late") out.push(e);
    }
  }
  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** Months worth offering in a picker: the term span of every client, newest first. */
export function monthsWithActivity(views: AdvertiserView[], asOf = today()): string[] {
  const months = new Set<string>([asOf.slice(0, 7)]);
  for (const view of views) {
    for (const e of scheduleFor(view)) months.add(e.period);
  }
  return [...months].sort().reverse();
}

const round = (n: number) => Math.round(n * 100) / 100;
