"use client";

import Link from "next/link";

export default function ContactCTA() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-[#0F0F0F]">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="text-4xl sm:text-5xl md:text-6xl text-white mb-6"
          data-animate="fade-up"
        >
          Let&apos;s Build Something Exceptional
        </h2>
        <p
          className="text-lg text-white/50 mb-12 max-w-xl mx-auto"
          data-animate="fade-up"
        >
          Every engagement begins with understanding your vision. We&apos;d
          love to hear about yours.
        </p>
        <div data-animate="fade-up">
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-10 py-4 border border-white/20 rounded-full text-sm uppercase tracking-widest text-white/80 hover:text-white hover:border-white/40 transition-all duration-500"
          >
            Start a Conversation
            <svg
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill="none"
              className="w-4 h-4"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
