"use client";

import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

export default function UrgencyCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC2626]/10 rounded-full mb-6 border border-[#DC2626]/20">
          <Clock className="w-4 h-4 text-[#DC2626]" />
          <span className="text-sm font-semibold text-[#DC2626]">
            Limited Availability
          </span>
        </div>

        <h2 className="scroll-reveal text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          Ready to Ship in 7 Days?
        </h2>
        <p className="scroll-reveal text-xl text-white/70 mb-4 max-w-2xl mx-auto">
          We&apos;re currently accepting a limited number of new projects for Q2 2026.
        </p>
        <p className="scroll-reveal text-lg text-white/50 mb-10 max-w-2xl mx-auto">
          Get direct founder access, enterprise-quality code, and
          AI-accelerated development — without the agency overhead.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/contact"
            className="group px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-2xl shadow-[#DC2626]/30"
          >
            Request Your 7-Day MVP
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/portfolio"
            className="px-8 py-4 bg-white/5 text-white rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300 border border-white/[0.08] backdrop-blur-sm"
          >
            View Case Studies
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 pt-8 border-t border-white/[0.08]">
          <p className="text-sm text-white/40 mb-4">
            Trusted by forward-thinking companies
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/30">
            <span>&#10003; Direct Founder Involvement</span>
            <span>&#10003; Enterprise-Grade Quality</span>
            <span>&#10003; AI-Accelerated Development</span>
            <span>&#10003; No Agency Bureaucracy</span>
          </div>
        </div>
      </div>
    </section>
  );
}
