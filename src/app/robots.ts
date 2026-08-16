import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/business";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Advertiser tooling and QR redirects are private/transient — keeping
        // them out of the index avoids diluting the site's topical focus.
        disallow: ["/api/", "/advertise/admin", "/review-requests", "/go/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
