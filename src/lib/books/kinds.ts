/**
 * The fixed lists a form needs: what kind of money, and which account.
 *
 * Kept free of imports so a browser-side form can use them without dragging
 * the database client along.
 */

import type { CategoryKind } from "./categories";

export type EntryKind = "income" | "expense" | "contribution" | "draw" | "transfer";
export type Direction = "in" | "out";
export type Account = "checking" | "stripe" | "cash";

export const ACCOUNTS: { id: Account; label: string; short: string }[] = [
  { id: "checking", label: "First Convenience Bank", short: "Bank" },
  { id: "stripe", label: "Stripe balance", short: "Stripe" },
  { id: "cash", label: "Cash", short: "Cash" },
];

export const KINDS: { id: EntryKind; label: string; direction: Direction | null; category: CategoryKind }[] = [
  { id: "income", label: "Money in", direction: "in", category: "income" },
  { id: "expense", label: "Money out", direction: "out", category: "expense" },
  { id: "contribution", label: "Owner put money in", direction: "in", category: "capital" },
  { id: "draw", label: "Owner took money out", direction: "out", category: "capital" },
  { id: "transfer", label: "Moved between accounts (cash out, Stripe payout)", direction: null, category: "transfer" },
];

export function kindOf(id: string) {
  return KINDS.find((k) => k.id === id) ?? null;
}

export function isAccount(id: string): id is Account {
  return ACCOUNTS.some((a) => a.id === id);
}

export function accountLabel(id: string): string {
  return ACCOUNTS.find((a) => a.id === id)?.short ?? id;
}
