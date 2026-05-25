"use client";

import Link from "next/link";

export default function BlogHero() {
  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] text-white relative overflow-hidden min-h-[60vh] flex items-center">
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6 leading-tight hero-headline">
          Journal
        </h1>
        <p className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto mb-8 hero-subheadline">
          Insights on engineering, architecture, and building software that endures.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/company"
            className="inline-flex items-center gap-3 px-8 py-3.5 border border-white/20 rounded-full text-sm uppercase tracking-widest text-white/80 hover:text-white hover:border-white/40 transition-all duration-500"
          >
            Our Story
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-8 py-3.5 border border-white/10 rounded-full text-sm uppercase tracking-widest text-white/50 hover:text-white/80 hover:border-white/20 transition-all duration-500"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
