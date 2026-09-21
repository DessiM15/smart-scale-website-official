/**
 * Who a client or lead is told to call about advertising.
 *
 * One place, because it appears in the renewal email and the lead
 * auto-reply, and those have drifted from the rate card before. Dessi's
 * call (2026-09-21): both of them, Jay and Dessiah, with both numbers.
 */
export const SALES_CONTACTS = [
  { name: "Jay", phoneDisplay: "832.407.0773", phoneHref: "tel:+18324070773" },
  { name: "Dessiah", phoneDisplay: "832.790.5001", phoneHref: "tel:+18327905001" },
] as const;

/** "Jay at 832.407.0773 or Dessiah at 832.790.5001", for prose. */
export const SALES_CALL_TEXT = SALES_CONTACTS.map((c) => `${c.name} at ${c.phoneDisplay}`).join(" or ");

/** The same, with tappable numbers, for HTML. `color` styles the links. */
export function salesCallHtml(color: string): string {
  return SALES_CONTACTS.map(
    (c) => `${c.name} at <a href="${c.phoneHref}" style="color:${color};font-weight:600;">${c.phoneDisplay}</a>`,
  ).join(" or ");
}

/** "Jay or Dessiah", for "X will call you". */
export const SALES_NAMES = SALES_CONTACTS.map((c) => c.name).join(" or ");

export const SALES_EMAIL = "info@smartscaleagent.com";
