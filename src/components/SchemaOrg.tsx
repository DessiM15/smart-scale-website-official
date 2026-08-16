import { BUSINESS, SERVICE_AREAS, SITE_URL, SOCIALS } from "@/lib/business";

/**
 * Site-wide structured data.
 *
 * Deliberately does NOT emit Review or AggregateRating. Google disallows
 * self-serving review markup — reviews about your own business, hosted on
 * your own domain — and strips the rich result when it finds it. The star
 * rating in search comes from the Google Business Profile, not from here.
 */
export default function SchemaOrg() {
  const professionalService = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/assets/smart-scale-logo-official.png`,
    image: `${SITE_URL}/og-image.png`,
    description:
      "Website design and local SEO for small businesses across Katy, Cypress, Houston, Sugar Land, Richmond, and Fulshear, Texas.",
    telephone: BUSINESS.phone.e164,
    email: BUSINESS.email,
    priceRange: BUSINESS.priceRange,
    // Service-area business: locality only, no streetAddress, matching the GBP.
    address: {
      "@type": "PostalAddress",
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    areaServed: SERVICE_AREAS.map((city) => ({
      "@type": "City",
      name: `${city.name}, TX`,
    })),
    sameAs: SOCIALS.map((s) => s.url),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Web Design & Local SEO Services",
      itemListElement: [
        "Business Websites",
        "Local SEO & Google Business Profile Management",
        "Custom Software & CRM",
        "Mobile Apps",
        "Automation & AI",
      ].map((name) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name },
      })),
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BUSINESS.name,
    publisher: { "@id": `${SITE_URL}/#business` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalService) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
