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
  // Permanent (301) redirects preserve the link equity of the old URLs after
  // the /what-we-do -> /services and /company -> /about renames.
  async redirects() {
    return [
      { source: "/what-we-do", destination: "/services", permanent: true },
      { source: "/company", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
