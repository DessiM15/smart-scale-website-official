import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise at Mex Taco House | In-Restaurant TV Advertising",
  description:
    "Own your category on Mex Taco House's dining-room screens — 4,800 plays a month in front of 5,000+ diners. One business per category, only 16 spots. Plans from $375/mo. Managed by Smart Scale.",
  openGraph: {
    title: "Advertise at Mex Taco House | In-Restaurant TV Advertising",
    description:
      "Own your category on Mex Taco House's dining-room screens — 4,800 plays a month in front of 5,000+ diners. One business per category, only 16 spots. Plans from $375/mo.",
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
