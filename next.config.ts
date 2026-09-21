import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Ad artwork is uploaded through a server action, and the default 1 MB
    // body limit rejects a normal 1920x1080 slide. 4.5 MB is the ceiling
    // Vercel's functions accept, so the artwork store caps itself at 4 MB to
    // leave room for the rest of the form.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  images: {
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
    // Device sizes cap at 2048. The 3840 entry meant any `100vw` image
    // served a 4K variant on a large monitor — a large LCP cost for a
    // difference almost nobody can see on a marketing page.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Add image sizes for different layouts
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Host and path redirects. All are permanent (308) so search engines
  // transfer ranking signals to the destination.
  async redirects() {
    return [
      // Send www to the apex. Both hostnames serving the same pages would
      // split ranking signals between two URLs for every page on the site;
      // a 308 consolidates them onto the canonical apex domain.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.smartscaleagent.com" }],
        destination: "https://smartscaleagent.com/:path*",
        permanent: true,
      },
      { source: "/what-we-do", destination: "/services", permanent: true },
      { source: "/company", destination: "/about", permanent: true },
      // Three pages left over from the software-agency era ("Week 1: Your
      // MVP", "Every Industry Deserves Modern Technology"). Nothing linked to
      // them, they carried the homepage title, and they described a business
      // this is not. Retired 2026-09-21.
      { source: "/industries", destination: "/services", permanent: true },
      { source: "/process", destination: "/about", permanent: true },
      { source: "/why-us", destination: "/about", permanent: true },
      // Service pages consolidated from seven to the four we actually sell
      // (2026-09-21). Each retired slug goes to its nearest surviving page.
      { source: "/services/email-client-development", destination: "/services", permanent: true },
      { source: "/services/web-applications", destination: "/services/enterprise-systems", permanent: true },
      { source: "/services/integrations-and-automation", destination: "/services/ai-enhancement-ai-workflows", permanent: true },
      // Three 2024 posts about offshore development and MVPs, written for a
      // software agency this no longer is. Retired the same day.
      { source: "/blog/how-ai-is-revolutionizing-custom-software-development", destination: "/blog", permanent: true },
      { source: "/blog/why-your-business-needs-an-mvp-first", destination: "/blog", permanent: true },
      { source: "/blog/the-hidden-costs-of-offshore-development", destination: "/blog", permanent: true },
    ];
  },
};

export default nextConfig;
