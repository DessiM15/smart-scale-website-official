import type { Metadata } from "next";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";
import RedSeparator from "@/components/ui/RedSeparator";

export const metadata: Metadata = {
  title: "Work",
  description:
    "A selection of enterprise platforms, AI systems, and digital experiences crafted with precision.",
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen">
      {/* Hero - Light */}
      <section data-theme="light" className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl text-[#111111] mb-6 hero-headline">
            Our Work
          </h1>
          <p className="text-lg sm:text-xl text-black/50 max-w-2xl mx-auto hero-subheadline">
            A selection of enterprise platforms, AI systems, and digital
            experiences.
          </p>
        </div>
      </section>

      <RedSeparator />

      <div data-theme="dark" className="bg-[#0A0A0A]">
        <PortfolioGrid />
      </div>
    </div>
  );
}
