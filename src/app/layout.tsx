import type { Metadata } from "next";
import { Inter, Playfair_Display, Bebas_Neue, Shadows_Into_Light } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import SchemaOrg from "@/components/SchemaOrg";
import { SITE_URL } from "@/lib/business";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
});

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-shadows",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Website Design in Katy & Houston, TX | Smart Scale",
    template: "%s | Smart Scale",
  },
  description:
    "Custom websites for local businesses across Katy, Cypress, and Houston. Built fast, built to get you found on Google. See our work.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Smart Scale",
    title: "Website Design in Katy & Houston, TX | Smart Scale",
    description:
      "Custom websites for local businesses across Katy, Cypress, and Houston. Built fast, built to get you found on Google.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Smart Scale \u2014 website design for Houston-area businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Design in Katy & Houston, TX | Smart Scale",
    description:
      "Custom websites for local businesses across Katy, Cypress, and Houston.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${bebasNeue.variable} ${shadowsIntoLight.variable}`}>
      <body className="bg-[#0A0A0A] text-white">
        <SchemaOrg />
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
