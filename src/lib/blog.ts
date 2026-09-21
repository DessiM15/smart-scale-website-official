export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  coverImage: string;
  coverImageAlt: string;
  category: string;
  readTime: string;
  content: string;
  metaDescription: string;
}

/**
 * Empty on purpose (2026-09-21). The three 2024 posts were about offshore
 * development and MVPs, written for a software agency this no longer is,
 * and they had earned nothing in search. Their URLs redirect to /blog in
 * next.config.ts. The first new posts are pricing guides for the Houston
 * market; until one lands, the Blog link stays out of the nav and footer.
 */
export const BLOG_POSTS: BlogPost[] = [];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return BLOG_POSTS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

