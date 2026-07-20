import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise at Mex Taco House | In-Restaurant TV Advertising",
  description:
    "Own your category on Mex Taco House's dining-room screens — seen by 5,000+ diners a month. One business per industry. Plans from $167/mo. Managed by Smart Scale.",
  openGraph: {
    title: "Advertise at Mex Taco House | In-Restaurant TV Advertising",
    description:
      "Own your category on Mex Taco House's dining-room screens — seen by 5,000+ diners a month. One business per industry. Plans from $167/mo.",
    type: "website",
  },
};

export default function AdvertiseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
