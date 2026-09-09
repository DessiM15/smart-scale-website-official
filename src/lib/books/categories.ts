/**
 * What money is for.
 *
 * Every ledger entry carries one of these, picked when it is entered, and
 * every one of them already maps to a line on the partnership return (Form
 * 1065). That mapping is the whole point: the categorising is done at the
 * counter, in September, not at the kitchen table in April.
 *
 * "capital" and "transfer" are not income or expense. Money one of the two of
 * you puts in, money you take out, and money moving between the business's
 * own accounts all change balances without touching profit, and the reports
 * keep them out of the P&L by kind rather than by anyone remembering to.
 */

export type CategoryKind = "income" | "expense" | "capital" | "transfer";

export type Category = {
  id: string;
  label: string;
  kind: CategoryKind;
  /** Where it lands on Form 1065, in words. */
  line: string;
  /** Fraction deductible when it isn't the whole amount. Meals are 0.5. */
  deductible?: number;
  /** Feeds the 1099 tally when set. */
  contractor?: boolean;
};

export const CATEGORIES: Category[] = [
  { id: "client-revenue", label: "Client revenue", kind: "income", line: "Line 1a, gross receipts" },
  { id: "ad-revenue", label: "Ad revenue (screens)", kind: "income", line: "Line 1a, gross receipts" },
  { id: "other-income", label: "Other income", kind: "income", line: "Line 7, other income" },

  { id: "equipment", label: "Equipment and supplies", kind: "expense", line: "Line 20, or depreciated if large" },
  { id: "software", label: "Software and subscriptions", kind: "expense", line: "Line 20, other deductions" },
  { id: "hosting", label: "Hosting and domains", kind: "expense", line: "Line 20, other deductions" },
  { id: "advertising", label: "Advertising and marketing", kind: "expense", line: "Line 20, other deductions" },
  { id: "meals", label: "Meals", kind: "expense", line: "Line 20, 50% deductible", deductible: 0.5 },
  { id: "travel", label: "Travel", kind: "expense", line: "Line 20, other deductions" },
  { id: "phone-internet", label: "Phone and internet", kind: "expense", line: "Line 20, other deductions" },
  { id: "professional", label: "Professional services", kind: "expense", line: "Line 20, other deductions" },
  { id: "contractors", label: "Contractors", kind: "expense", line: "Line 20, other deductions", contractor: true },
  { id: "insurance", label: "Insurance", kind: "expense", line: "Line 20, other deductions" },
  { id: "taxes-licenses", label: "Taxes and licenses", kind: "expense", line: "Line 14, taxes and licenses" },
  { id: "bank-fees", label: "Bank fees and interest", kind: "expense", line: "Line 15 / 20" },
  { id: "processing-fees", label: "Payment processing fees", kind: "expense", line: "Line 20, other deductions" },
  { id: "venue-share", label: "Venue revenue share", kind: "expense", line: "Line 20, other deductions" },
  { id: "refunds", label: "Refunds to clients", kind: "expense", line: "Line 1b, returns and allowances" },
  { id: "other-expense", label: "Other expense", kind: "expense", line: "Line 20, other deductions" },

  { id: "owner-contribution", label: "Owner contribution", kind: "capital", line: "Partner capital, Schedule K-1" },
  { id: "owner-draw", label: "Owner draw", kind: "capital", line: "Partner capital, Schedule K-1" },

  { id: "transfer", label: "Transfer between accounts", kind: "transfer", line: "Moves money, changes nothing" },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryOf(id: string): Category {
  return BY_ID.get(id) ?? BY_ID.get("other-expense")!;
}

export function isCategoryId(id: string): boolean {
  return BY_ID.has(id);
}

export function categoriesOfKind(kind: CategoryKind): Category[] {
  return CATEGORIES.filter((c) => c.kind === kind);
}

/** The ids the receipt reader may choose from. Expenses only; a receipt is never income. */
export const RECEIPT_CATEGORY_IDS = categoriesOfKind("expense").map((c) => c.id);
