/**
 * Single source of truth for NAP (Name, Address, Phone) and social profiles.
 *
 * Local ranking depends on this data being byte-identical everywhere it
 * appears — the site, the Google Business Profile, and every directory
 * citation. Changing a value here changes it on the page and in the JSON-LD
 * at the same time, so the two can never drift apart.
 *
 * Smart Scale is a service-area business: the GBP has no public street
 * address, so none is published here either. Google cross-checks the two.
 */

export const SITE_URL = "https://smartscaleagent.com";

export const BUSINESS = {
  name: "Smart Scale",
  legalName: "Smart Scale, LLC",
  email: "info@smartscaleagent.com",
  /** Must match the Google Business Profile exactly. */
  phone: {
    display: "832.790.5001",
    href: "tel:+18327905001",
    e164: "+18327905001",
  },
  /**
   * Where the business is based. Service-area business with the address
   * hidden on the Google Business Profile, so no streetAddress and no
   * postalCode — asserting either would claim a precision the listing
   * deliberately withholds, and Google cross-checks the two.
   */
  locality: "Katy",
  region: "TX",
  country: "US",
  /** Approximate centroid of the service area, for geo schema. */
  geo: { latitude: 29.7858, longitude: -95.8245 },
  priceRange: "$$",
} as const;

/** Cities served, in priority order. `page` marks the ones with a landing page. */
export const SERVICE_AREAS = [
  { name: "Katy", slug: "katy", page: true },
  { name: "Cypress", slug: "cypress", page: true },
  { name: "Houston", slug: "houston", page: true },
  { name: "Sugar Land", slug: "sugar-land", page: false },
  { name: "Pearland", slug: "pearland", page: false },
  { name: "Richmond", slug: "richmond", page: false },
  { name: "Fulshear", slug: "fulshear", page: false },
] as const;

export const CITY_PAGES = SERVICE_AREAS.filter((c) => c.page);

export const SOCIALS = [
  { name: "Instagram", url: "https://www.instagram.com/smartscaleagent" },
  { name: "TikTok", url: "https://www.tiktok.com/@smartscaleagent" },
  { name: "Facebook", url: "https://www.facebook.com/smartscalellc" },
  { name: "YouTube", url: "https://www.youtube.com/@smartscaleagent" },
] as const;

/**
 * Google Calendar appointment schedule for a discovery call. The short link
 * is what Dessi shares; the long form is what the embed needs (`gv=true`
 * renders it as a widget). Both point at the same schedule.
 */
export const BOOKING_URL = "https://calendar.app.google/b1gQXqqNLL9CsJjr6";
export const BOOKING_EMBED_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3hhMc0Hzx2p_oifbHVCUkFHLXZHWBMVyj11VOTMEZch797t54a31aX1o_gbR1SWVchER4900D9?gv=true";

/** Public Google Business Profile link, used for the reviews CTA. */
export const GBP_URL = "https://share.google/kKkXs3Nicidp8n8jy";
