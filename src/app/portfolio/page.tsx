import type { Metadata } from "next";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";

export const metadata: Metadata = {
  title: "Portfolio | Smart Scale",
  description:
    "Explore our work — 13 real client projects spanning websites, landing pages, platforms, and mobile apps.",
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 hero-headline">
            Our Work
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto hero-subheadline">
            Real projects, real results. See how we help businesses launch and
            scale with modern technology.
          </p>
        </div>
      </section>

      <PortfolioGrid />
    </div>
  );
}
