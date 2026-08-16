import type { MetadataRoute } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { projects } from "@/data/projects";
import { SERVICES } from "@/lib/constants";
import { BLOG_POSTS } from "@/lib/blog";
import { CITY_PAGES, SITE_URL } from "@/lib/business";

/**
 * Blog cover images are stored without an extension and resolved in the
 * browser by trying .jpg, then .webp, then .png. A sitemap needs a real URL,
 * so resolve the actual file from disk at build time instead of guessing.
 */
function resolveCoverImage(base: string): string | null {
  for (const ext of [".jpg", ".webp", ".png"]) {
    if (existsSync(join(process.cwd(), "public", `${base}${ext}`))) {
      return `${base}${ext}`;
    }
  }
  return null;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = (
    [
      { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
      { url: `${SITE_URL}/portfolio`, changeFrequency: "weekly", priority: 0.9 },
      { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.9 },
      { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
      { url: `${SITE_URL}/industries`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${SITE_URL}/process`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${SITE_URL}/why-us`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ] satisfies Omit<MetadataRoute.Sitemap[number], "lastModified">[]
  ).map((page) => ({ ...page, lastModified: now }));

  // City landing pages carry high priority — they are the primary local
  // search entry points.
  const cityPages: MetadataRoute.Sitemap = CITY_PAGES.map((city) => ({
    url: `${SITE_URL}/web-design/${city.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const servicePages: MetadataRoute.Sitemap = SERVICES.map((service) => ({
    url: `${SITE_URL}/services/${service.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // `images` tells Google which screenshot belongs to which case study.
  // Google Images is a real referrer for design work, and without this the
  // association is left to inference.
  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/portfolio/${project.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    images: [`${SITE_URL}${project.thumbnailImage}`],
  }));

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => {
    const cover = resolveCoverImage(post.coverImage);
    return {
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
      ...(cover && { images: [`${SITE_URL}${cover}`] }),
    };
  });

  return [
    ...staticPages,
    ...cityPages,
    ...servicePages,
    ...projectPages,
    ...blogPages,
  ];
}
