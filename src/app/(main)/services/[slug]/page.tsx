import type { Metadata } from "next";
import { SERVICES } from "@/lib/constants";
import { SITE_URL } from "@/lib/business";
import ServicePageClient from "@/components/ServicePageClient";

// Server component wrapper to handle Promise-based params
interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);

  if (!service) {
    return { title: "Service Not Found" };
  }

  // Local intent in the title — "in Katy & Houston, TX" is what people
  // actually type, and it distinguishes these from generic service pages.
  const title = `${service.title} in Katy & Houston, TX`;

  return {
    title,
    description: service.extendedDescription,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title,
      description: service.extendedDescription,
      url: `${SITE_URL}/services/${service.slug}`,
      type: "website",
    },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);

  const pageUrl = `${SITE_URL}/services/${slug}`;

  const serviceSchema = service && {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.extendedDescription,
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: [
      "Katy",
      "Cypress",
      "Houston",
      "Sugar Land",
      "Richmond",
      "Fulshear",
    ].map((name) => ({ "@type": "City", name: `${name}, TX` })),
    url: pageUrl,
  };

  const breadcrumbSchema = service && {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: `${SITE_URL}/services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ServicePageClient slug={slug} />
    </>
  );
}
