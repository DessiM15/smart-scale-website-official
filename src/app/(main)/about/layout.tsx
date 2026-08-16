import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "About Smart Scale | Web Design Agency in Katy, TX" },
  description:
    "Smart Scale is a web design and local SEO agency in Katy, TX, building websites for small businesses across the Houston metro.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
