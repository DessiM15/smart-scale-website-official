import type { Metadata } from "next";
import { Inter, Playfair_Display, Bebas_Neue } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import SchemaOrg from "@/components/SchemaOrg";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://smartscaleagent.com"),
  title: {
    default: "Smart Scale | Precision Software for Enterprise",
    template: "%s | Smart Scale",
  },
  description:
    "Precision-engineered enterprise software, AI systems, and digital platforms. Architected for growth, built without compromise.",
  keywords: [
    "enterprise software development",
    "AI systems",
    "custom software",
    "digital transformation",
    "web applications",
    "mobile development",
    "enterprise platforms",
    "software consultancy",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://smartscaleagent.com",
    siteName: "Smart Scale",
    title: "Smart Scale | Precision Software for Enterprise",
    description:
      "Precision-engineered enterprise software, AI systems, and digital platforms. Architected for growth, built without compromise.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Smart Scale - Precision Software for Enterprise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Scale | Precision Software for Enterprise",
    description:
      "Precision-engineered enterprise software, AI systems, and digital platforms.",
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
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${bebasNeue.variable}`}>
      <body className="bg-[#0A0A0A] text-white">
        <SchemaOrg />
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
