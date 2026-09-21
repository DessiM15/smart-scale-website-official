/**
 * Google Analytics 4 event helper.
 *
 * `NEXT_PUBLIC_GA_ID` (a `G-XXXXXXXXXX` measurement id) turns the whole
 * thing on. Unset, `Analytics` renders nothing and `track` is a no-op, so
 * the site behaves identically in a preview with no id.
 *
 * Event names follow GA4's recommended set where one exists, because GA4
 * treats those as conversions with less setup:
 *   - generate_lead   a form was actually submitted and accepted
 *   - phone_call      a tel: link was tapped (custom, but conventional)
 *   - email_click     a mailto: link was tapped
 *   - cta_click       a link marked with data-track was clicked
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Params = {}): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}
