import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Contact Smart Scale | Web Design in Katy & Houston, TX" },
  description:
    "Tell us about your business and we'll show you what we'd build. Serving Katy, Cypress, Houston, Sugar Land, Richmond, and Fulshear, TX.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
