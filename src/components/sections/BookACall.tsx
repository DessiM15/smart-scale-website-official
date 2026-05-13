"use client";

import BookingWidget from "@/components/booking/BookingWidget";

export default function BookACall() {
  return (
    <section
      id="book"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111] relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC2626]/10 rounded-full mb-6 border border-[#DC2626]/20">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            <span className="text-sm font-semibold text-[#DC2626]">
              Free Consultation
            </span>
          </div>
          <h2 className="scroll-reveal text-4xl sm:text-5xl font-bold text-white mb-4">
            Book a Discovery Call
          </h2>
          <p className="scroll-reveal text-lg text-white/60 max-w-2xl mx-auto">
            Schedule a free 30-minute call to discuss your project with our
            team. No commitment, no pressure.
          </p>
        </div>

        <BookingWidget />
      </div>
    </section>
  );
}
