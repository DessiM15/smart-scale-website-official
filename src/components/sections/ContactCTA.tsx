"use client";

import Link from "next/link";
import { BOOKING_URL } from "@/lib/business";

export default function ContactCTA() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white" data-theme="light">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#111111] mb-6"
          data-animate="word-reveal"
        >
          Ready to Get Found Online?
        </h2>
        <p
          className="text-lg text-black/50 mb-12 max-w-xl mx-auto"
          data-animate="fade-up"
        >
          Tell us about your business and we&apos;ll show you exactly what
          we&apos;d do. No pressure, no jargon.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center" data-animate="fade-up">
          <Link
            href="/contact"
            className="btn-hover-enhanced inline-flex items-center gap-3 px-10 py-4 bg-[#DC2626] text-white rounded-full text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-500"
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
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-track="book_call"
            className="inline-flex items-center gap-3 px-10 py-4 border border-black/20 text-[#111111] rounded-full text-sm uppercase tracking-widest hover:border-[#DC2626] hover:text-[#DC2626] transition-all duration-500"
          >
            Book a call
          </a>
        </div>
      </div>
    </section>
  );
}
