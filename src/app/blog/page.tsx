import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import BlogHero from "@/components/BlogHero";

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block bg-white rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-[#DC2626]"
              >
                {/* Cover Image */}
                <div
                  className="h-48 w-full relative overflow-hidden"
                  style={{
                    background:
                      post.coverImage === "neural-network"
                        ? "linear-gradient(135deg, #1F2937 0%, #000000 100%), radial-gradient(circle at 30% 30%, rgba(220,38,38,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(220,38,38,0.2) 0%, transparent 50%)"
                        : post.coverImage === "rocket-launch"
                        ? "linear-gradient(135deg, #000000 0%, #1F2937 100%), radial-gradient(circle at 50% 0%, rgba(220,38,38,0.4) 0%, transparent 70%)"
                        : "linear-gradient(135deg, #DC2626 0%, #991B1B 100%), radial-gradient(circle at 20% 20%, rgba(0,0,0,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2) 0%, transparent 50%)",
                  }}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  {/* Abstract pattern overlay */}
                  <div className="absolute inset-0 opacity-30">
                    {post.coverImage === "neural-network" && (
                      <div className="absolute inset-0" style={{
                        backgroundImage: "radial-gradient(circle at 20% 30%, rgba(220,38,38,0.4) 2px, transparent 2px), radial-gradient(circle at 60% 50%, rgba(220,38,38,0.3) 1px, transparent 1px), radial-gradient(circle at 80% 70%, rgba(220,38,38,0.2) 1.5px, transparent 1.5px)",
                        backgroundSize: "50px 50px, 30px 30px, 40px 40px",
                      }}></div>
                    )}
                    {post.coverImage === "rocket-launch" && (
                      <div className="absolute inset-0" style={{
                        background: "linear-gradient(180deg, transparent 0%, rgba(220,38,38,0.2) 50%, transparent 100%)",
                      }}></div>
                    )}
                    {post.coverImage === "world-map" && (
                      <div className="absolute inset-0" style={{
                        backgroundImage: "linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%)",
                        backgroundSize: "20px 20px",
                      }}></div>
                    )}
                  </div>
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
        </div>
      </section>
    </div>
  );
}

