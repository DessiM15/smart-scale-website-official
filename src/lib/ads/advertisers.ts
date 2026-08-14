/**
 * QR link registry for the Mex Taco House ad rotation.
 *
 * Every ad in the rotation gets a short, trackable URL that lives on our own
 * domain — smartscaleagent.com/go/<code> — instead of pointing the QR straight
 * at the advertiser. The redirect route counts the scan, then forwards the
 * phone on to the advertiser's real page. The guest never notices; we get the
 * only number that proves the screens work.
 *
 * TO ADD AN ADVERTISER: copy a block below, pick a short code, paste their URL,
 * commit, and regenerate the QR with `node scripts/make-qr.mjs`.
 *
 * NEVER change or reuse a `code` once the ad is printed/on screen — the QR is
 * already out in the world. Retire a link by flipping `active` to false, which
 * keeps its history and sends late scans to the fallback instead of a dead page.
 */

export type AdLink = {
  /** The slug in smartscaleagent.com/go/<code>. Lowercase, short, no spaces. */
  code: string;
  /** Business name, as shown on the report. */
  advertiser: string;
  /** Exclusivity category they own in the rotation. */
  category: string;
  /** Where the scan actually lands. Must be a full https:// URL. */
  destination: string;
  /** false = ad has ended. Keeps the stats, retires the link. */
  active: boolean;
  /** YYYY-MM-DD the spot went live. Shown on the report. */
  startedOn?: string;
  /**
   * Append utm_source/medium/campaign to the destination (default true).
   * This makes the traffic show up as "mex-taco-house" inside the advertiser's
   * OWN Google Analytics — so they can verify our numbers independently.
   * Set false only if their site breaks on extra query params.
   */
  tagDestination?: boolean;
};

/** Where unknown, retired, or mistyped codes end up. Never a 404. */
export const FALLBACK_DESTINATION = "https://smartscaleagent.com/advertise";

export const AD_LINKS: AdLink[] = [
  {
    code: "spot",
    advertiser: "Mex Taco House — house slide",
    category: "Advertise with us",
    destination: "https://smartscaleagent.com/advertise",
    active: true,
    startedOn: "2026-08-13",
    tagDestination: false,
  },

  // ---- Example advertiser blocks. Replace with real ones. ----
  // {
  //   code: "plumb",
  //   advertiser: "Rio Grande Plumbing",
  //   category: "Plumbing",
  //   destination: "https://riograndeplumbing.com",
  //   active: true,
  //   startedOn: "2026-09-01",
  // },
  // {
  //   code: "dental",
  //   advertiser: "Bayou Family Dental",
  //   category: "Dentistry",
  //   destination: "https://bayoufamilydental.com/new-patients",
  //   active: true,
  //   startedOn: "2026-09-01",
  // },
];

export function findAdLink(code: string): AdLink | undefined {
  const wanted = code.trim().toLowerCase();
  return AD_LINKS.find((l) => l.code.toLowerCase() === wanted);
}

/**
 * The destination with campaign tags attached, so the advertiser's own
 * analytics attributes the visit to the restaurant screens.
 */
export function resolveDestination(link: AdLink): string {
  if (link.tagDestination === false) return link.destination;
  try {
    const url = new URL(link.destination);
    if (!url.searchParams.has("utm_source")) {
      url.searchParams.set("utm_source", "mex-taco-house");
      url.searchParams.set("utm_medium", "qr-instore-screen");
      url.searchParams.set("utm_campaign", link.code);
    }
    return url.toString();
  } catch {
    return link.destination;
  }
}
