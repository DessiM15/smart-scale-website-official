import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import BlogHero from "@/components/BlogHero";
import BlogCoverImage from "@/components/BlogCoverImage";

export const metadata = {
  title: "Blog | Smart Scale - AI & Software Development Insights",
  description: "Expert insights on AI-accelerated development, MVP strategies, and software development best practices from Smart Scale.",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="min-h-screen bg-white">
      <BlogHero />

      {/* Blog Posts Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6B7280] text-lg">No blog posts available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block bg-white rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-[#DC2626]"
              >
                {/* Cover Image */}
                <div className="h-48 w-full relative overflow-hidden bg-gray-200">
                  <BlogCoverImage
                    src={post.coverImage}
                    alt={post.coverImageAlt}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false} // Lazy load blog list images
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-3 text-sm text-[#6B7280]">
                    <span className="px-3 py-1 bg-[#F3F4F6] rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-3 text-black group-hover:text-[#DC2626] transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-[#6B7280] mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <span className="text-[#DC2626] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

