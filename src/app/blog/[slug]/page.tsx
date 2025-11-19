import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, getAllBlogPosts } from "@/lib/blog";
import { Calendar, Clock, ArrowLeft, Share2, Twitter, Facebook, Linkedin } from "lucide-react";
import SocialShareButtons from "@/components/SocialShareButtons";
import TechBackground from "@/components/TechBackground";

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | Smart Scale Blog`,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  // Convert markdown-like content to HTML (simplified - in production, use a markdown parser)
  const formatContent = (content: string) => {
    const lines = content.split("\n");
    let html = "";
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("# ")) {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        html += `<h1 class="text-4xl font-bold mb-6 text-black mt-12 first:mt-0">${trimmed.substring(2)}</h1>`;
        continue;
      }
      if (trimmed.startsWith("## ")) {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        html += `<h2 class="text-3xl font-bold mb-4 text-black mt-10">${trimmed.substring(3)}</h2>`;
        continue;
      }
      if (trimmed.startsWith("### ")) {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        html += `<h3 class="text-2xl font-bold mb-3 text-black mt-8">${trimmed.substring(4)}</h3>`;
        continue;
      }

      // Lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (!inList) {
          html += '<ul class="list-disc list-inside space-y-2 mb-6 text-[#6B7280] text-lg">';
          inList = true;
        }
        const listItem = trimmed.substring(2).replace(/\*\*/g, "<strong class='text-black font-semibold'>").replace(/\*\*/g, "</strong>");
        html += `<li class="ml-4">${listItem}</li>`;
        continue;
      }

      // Close list if needed
      if (inList && trimmed === "") {
        html += "</ul>";
        inList = false;
        continue;
      }

      // Empty lines
      if (trimmed === "") {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        html += "<br />";
        continue;
      }

      // Regular paragraphs with formatting
      if (inList) {
        html += "</ul>";
        inList = false;
      }

      let processedLine = trimmed;
      
      // Bold text
      processedLine = processedLine.replace(/\*\*([^\*]+)\*\*/g, '<strong class="text-black font-semibold">$1</strong>');
      
      // Links
      processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#DC2626] hover:underline font-semibold">$1</a>');

      html += `<p class="text-[#6B7280] leading-relaxed mb-4 text-lg">${processedLine}</p>`;
    }

    if (inList) {
      html += "</ul>";
    }

    return html;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    image: `https://smartscale.com/blog/${post.coverImage}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Smart Scale",
      logo: {
        "@type": "ImageObject",
        url: "https://smartscale.com/assets/smart-scale-logo-official.png",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden">
          <TechBackground />
          <div className="max-w-4xl mx-auto relative z-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </Link>

            <div className="flex items-center gap-4 mb-4 text-sm">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
                {post.category}
              </span>
              <div className="flex items-center gap-1 text-white/70">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-white/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <span>•</span>
              <span>{post.author}</span>
            </div>
          </div>
        </section>

        {/* Cover Image */}
        <section className="relative h-64 md:h-96 w-full overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                post.coverImage === "neural-network"
                  ? "linear-gradient(135deg, #1F2937 0%, #000000 100%), radial-gradient(circle at 30% 30%, rgba(220,38,38,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(220,38,38,0.2) 0%, transparent 50%)"
                  : post.coverImage === "rocket-launch"
                  ? "linear-gradient(135deg, #000000 0%, #1F2937 100%), radial-gradient(circle at 50% 0%, rgba(220,38,38,0.4) 0%, transparent 70%)"
                  : "linear-gradient(135deg, #DC2626 0%, #991B1B 100%), radial-gradient(circle at 20% 20%, rgba(0,0,0,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2) 0%, transparent 50%)",
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
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
        </section>

        {/* Article Content */}
        <article className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Social Share Buttons */}
            <div className="mb-12">
              <SocialShareButtons
                title={post.title}
                url={`https://smartscale.com/blog/${post.slug}`}
              />
            </div>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
            />

            {/* CTA Section */}
            <div className="mt-16 p-8 bg-[#F3F4F6] rounded-lg border-l-4 border-[#DC2626]">
              <h3 className="text-2xl font-bold mb-4 text-black">
                Ready to Transform Your Development Process?
              </h3>
              <p className="text-[#6B7280] mb-6 text-lg">
                Experience the power of AI-accelerated development with Smart Scale. Get your MVP in 7 days with direct founder involvement.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white rounded-full font-semibold hover:bg-red-700 transition-colors"
              >
                Schedule Free Consultation
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}

