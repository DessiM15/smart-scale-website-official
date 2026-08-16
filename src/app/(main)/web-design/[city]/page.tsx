import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, getCity } from "@/lib/cities";
import { BUSINESS, SITE_URL } from "@/lib/business";
import RedSeparator from "@/components/ui/RedSeparator";

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};

  return {
    // city.title already ends in "| Smart Scale", so bypass the template.
    title: { absolute: city.title },
    description: city.description,
    alternates: { canonical: `/web-design/${city.slug}` },
    openGraph: {
      title: city.title,
      description: city.description,
      url: `${SITE_URL}/web-design/${city.slug}`,
      type: "website",
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  const pageUrl = `${SITE_URL}/web-design/${city.slug}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Website Design in ${city.name}, TX`,
    description: city.description,
    serviceType: "Web Design and Local SEO",
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: { "@type": "City", name: `${city.name}, TX` },
    url: pageUrl,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: city.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Web Design",
        item: `${SITE_URL}/services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${city.name}, TX`,
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero */}
      <section
        data-theme="light"
        className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-4xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-black/40">
              <li>
                <Link href="/" className="hover:text-black transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-black transition-colors"
                >
                  Web Design
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-black/70">{city.name}, TX</li>
            </ol>
          </nav>

          <h1 className="text-4xl sm:text-5xl md:text-6xl text-[#111111] mb-8 leading-[1.1]">
            {city.h1}
          </h1>

          <div className="space-y-5">
            {city.intro.map((para) => (
              <p
                key={para.slice(0, 40)}
                className="text-lg text-black/60 leading-relaxed"
              >
                {para}
              </p>
            ))}
          </div>

          <p className="mt-8 text-sm text-black/40">
            Neighborhoods and areas we work in around {city.name}:{" "}
            {city.landmarks.join(", ")}.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="btn-hover-enhanced inline-flex items-center justify-center px-8 py-3.5 bg-[#DC2626] text-white rounded-full text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-500"
            >
              Get a Fixed Quote
            </Link>
            <a
              href={BUSINESS.phone.href}
              className="inline-flex items-center justify-center px-8 py-3.5 border border-black/20 text-[#111111] rounded-full text-sm uppercase tracking-widest hover:border-black/50 transition-all duration-500"
            >
              Call {BUSINESS.phone.display}
            </a>
          </div>
        </div>
      </section>

      <RedSeparator />

      {/* Industries */}
      <section
        data-theme="dark"
        className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] noise-overlay"
      >
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-4xl text-white mb-4">
            Who we build for in {city.name}
          </h2>
          <p className="text-white/50 mb-12">
            The categories we see most often here, and what actually moves the
            needle for each.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {city.industries.map((industry) => (
              <div
                key={industry.name}
                className="border-l-2 border-[#DC2626]/40 pl-6"
              >
                <h3 className="text-lg text-white mb-2">{industry.name}</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {industry.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local angle */}
      <section
        data-theme="light"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl text-[#111111] mb-8">
            {city.localAngle.heading}
          </h2>
          <div className="space-y-5">
            {city.localAngle.body.map((para) => (
              <p
                key={para.slice(0, 40)}
                className="text-lg text-black/60 leading-relaxed"
              >
                {para}
              </p>
            ))}
          </div>

          <p className="mt-10 text-black/60">
            Want to see what we&apos;ve built?{" "}
            <Link
              href="/portfolio"
              className="text-[#DC2626] underline underline-offset-4"
            >
              Browse our website portfolio
            </Link>{" "}
            or read more about{" "}
            <Link
              href="/services"
              className="text-[#DC2626] underline underline-offset-4"
            >
              our web design and local SEO services
            </Link>
            .
          </p>
        </div>
      </section>

      <RedSeparator />

      {/* FAQ */}
      <section
        data-theme="dark"
        className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] noise-overlay"
      >
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-4xl text-white mb-12">
            Common questions from {city.name} businesses
          </h2>
          <div className="space-y-8">
            {city.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-lg text-white mb-3">{faq.question}</h3>
                <p className="text-white/50 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          {/* Internal links to sibling city pages. */}
          <div className="mt-16 pt-8 border-t border-white/[0.08]">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-4">
              We also serve
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {city.nearby.map((slug) => {
                const other = CITIES.find((c) => c.slug === slug);
                if (!other) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={`/web-design/${other.slug}`}
                      className="text-sm text-white/60 hover:text-white underline underline-offset-4 transition-colors"
                    >
                      Website design in {other.name}, TX
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
