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
  { name: "Richmond", slug: "richmond", page: false },
  { name: "Fulshear", slug: "fulshear", page: false },
] as const;

export const CITY_PAGES = SERVICE_AREAS.filter((c) => c.page);

export const SOCIALS = [
  { name: "Instagram", url: "https://www.instagram.com/smartscaleagent" },
  { name: "TikTok", url: "https://www.tiktok.com/@smartscaleagent" },
] as const;

/** Public Google Business Profile link, used for the reviews CTA. */
export const GBP_URL = "https://share.google/kKkXs3Nicidp8n8jy";
