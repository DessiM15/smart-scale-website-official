import type { Metadata } from "next";

// The services page itself is a client component, so it cannot export
// metadata. This layout supplies it instead.
export const metadata: Metadata = {
  // `absolute` opts out of the root "%s | Smart Scale" template — this
  // title already carries the brand, and doubling it wastes SERP characters.
  title: {
    absolute: "Web Design & Local SEO Services in Houston, TX | Smart Scale",
  },
  description:
    "Website design, local SEO, custom software, and mobile apps for businesses in Katy, Cypress, Houston, Sugar Land, Richmond, and Fulshear, TX.",
  alternates: { canonical: "/services" },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
