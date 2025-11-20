"use client";

import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

export default function UrgencyCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1F2937] via-black to-[#1F2937] text-white relative overflow-hidden">
      {/* Abstract geometric background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC2626]/20 rounded-full mb-6 border border-[#DC2626]/30">
          <Clock className="w-4 h-4 text-[#DC2626]" />
          <span className="text-sm font-semibold text-[#DC2626]">
            Limited Availability
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          Ready to Ship in 7 Days?
        </h2>
        <p className="text-xl text-white/80 mb-4 max-w-2xl mx-auto">
          We're currently accepting a limited number of new projects for Q1 2026.
        </p>
        <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
          Get direct founder access, enterprise-quality code, and AI-accelerated development—without the agency overhead.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/contact"
            className="group px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-2xl shadow-[#DC2626]/50"
          >
            Request Your 7-Day MVP
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/portfolio"
            className="px-8 py-4 bg-white/10 text-white rounded-full text-lg font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 backdrop-blur-sm"
          >
            View Case Studies
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-white/60 mb-4">Trusted by forward-thinking companies</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
            <span>✓ Direct Founder Involvement</span>
            <span>✓ Enterprise-Grade Quality</span>
            <span>✓ AI-Accelerated Development</span>
            <span>✓ No Agency Bureaucracy</span>
          </div>
        </div>
      </div>
    </section>
  );
}

