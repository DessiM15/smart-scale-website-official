export default function SchemaOrg() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Smart Scale",
    url: "https://smartscalesoftware.com",
    logo: "https://smartscalesoftware.com/assets/smart-scale-logo-official.png",
    description:
      "Precision-engineered enterprise software, AI systems, and digital platforms.",
    address: {
      "@type": "PostalAddress",
      addressRegion: "TX",
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "project@ssl-mail.com",
      contactType: "sales",
    },
    sameAs: [],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Software Development",
    provider: {
      "@type": "Organization",
      name: "Smart Scale",
    },
    description:
      "Enterprise software development, AI systems, web applications, mobile development, and digital strategy consulting.",
    areaServed: "US",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://smartscalesoftware.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Work",
        item: "https://smartscalesoftware.com/portfolio",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Services",
        item: "https://smartscalesoftware.com/what-we-do",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "About",
        item: "https://smartscalesoftware.com/company",
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Contact",
        item: "https://smartscalesoftware.com/contact",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}
