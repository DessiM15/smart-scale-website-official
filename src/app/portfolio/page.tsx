import type { Metadata } from "next";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";

export const metadata: Metadata = {
  title: "Work",
  description:
    "A selection of enterprise platforms, AI systems, and digital experiences crafted with precision.",
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero with gradient mesh */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 50% 50%, rgba(185, 28, 28, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 30%, rgba(220, 38, 38, 0.05) 0%, transparent 45%),
              radial-gradient(ellipse at 10% 70%, rgba(139, 0, 0, 0.05) 0%, transparent 40%)
            `,
          }}
        />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl text-white mb-6 hero-headline">
            Our Work
          </h1>
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto hero-subheadline">
            A selection of enterprise platforms, AI systems, and digital
            experiences.
          </p>
        </div>
      </section>

      <PortfolioGrid />
    </div>
  );
}
