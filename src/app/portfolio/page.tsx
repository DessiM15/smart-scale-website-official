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
      {/* Hero */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
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
