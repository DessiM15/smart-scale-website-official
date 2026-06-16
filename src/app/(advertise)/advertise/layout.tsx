import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise at Mex Taco House | In-Restaurant TV Advertising",
  description:
    "Reach 500+ diners weekly with your ad on Mex Taco House's in-restaurant TV screens. Affordable plans starting at $99/mo. Powered by Smart Scale.",
  openGraph: {
    title: "Advertise at Mex Taco House | In-Restaurant TV Advertising",
    description:
      "Reach 500+ diners weekly with your ad on Mex Taco House's in-restaurant TV screens. Affordable plans starting at $99/mo.",
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
