/**
 * Seed QR links, and the fallback the redirect uses when the database can't be
 * reached.
 *
 * QR codes are created and edited in the tracker now — see ./link-store. This
 * file is no longer where you add an advertiser. It exists so that /go/<code>
 * still resolves during an outage, and so the very first codes exist before
 * anything has been entered.
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


