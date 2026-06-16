"use client";

import Link from "next/link";

export default function BlogHero() {
  return (
    <section data-theme="light" className="bg-white min-h-[60vh] flex items-center py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-black/50 font-light mb-6">Insights & Articles</p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#111111] mb-4 sm:mb-6 leading-tight hero-headline">
          Journal
        </h1>
        <p className="text-lg text-black/50 max-w-3xl mx-auto mb-8 hero-subheadline">
          Insights on engineering, architecture, and building software that endures.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/company"
            className="inline-flex items-center gap-3 px-8 py-3.5 border border-black/20 rounded-full text-sm uppercase tracking-widest text-[#111111]/80 hover:text-[#111111] hover:border-black/40 transition-all duration-500"
          >
            Our Story
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-8 py-3.5 border border-black/10 rounded-full text-sm uppercase tracking-widest text-black/50 hover:text-[#111111]/80 hover:border-black/20 transition-all duration-500"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
