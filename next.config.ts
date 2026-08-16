import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
