"use client";

import { useState } from "react";
import Image from "next/image";

const clients = [
  {
    name: "Gulf Coast Alloys",
    src: "/assets/client-logos/gulf-coast-alloys.png",
    description:
      "Houston-based industrial metals and alloys distributor supplying pipe, fittings, flanges, and copper-nickel products — sourced directly from 20+ mill partners across South Korea and Vietnam for the oil & gas, petrochemical, and marine industries.",
    built:
      "Corporate website with product catalog, material specifications, and request-for-quote workflow for B2B buyers.",
  },
  {
    name: "Botmakers",
    src: "/assets/client-logos/botmakers.png",
    description:
      "Enterprise AI software firm and division of BioQuest Inc. (BQST). Builds custom AI-powered systems for Fortune 500 companies, government agencies, nonprofits, law firms, and more — specializing in intelligent automation and predictive analytics.",
    built:
      "Full-stack CRM platform with Supabase and Stripe invoicing, plus a corporate website featuring a live AI chatbot powered by OpenAI.",
  },
  {
    name: "APEX Affinity Group",
    src: "/assets/client-logos/apex-affinity.png",
    description:
      "Network marketing company combining AI-powered business tools (Pulse Suite CRM, lead generation, automation) with insurance distribution — life, annuities, and ancillary protection for both unlicensed entrepreneurs and licensed professionals.",
    built:
      "Corporate website with service showcases, compensation structure breakdowns, and lead generation workflows.",
  },
];

export default function SocialProof() {
  const [activeClient, setActiveClient] = useState<string | null>(null);

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]" data-theme="dark">
      <div className="max-w-6xl mx-auto">
        <p
          className="text-center text-white/40 text-sm uppercase tracking-widest mb-16"
          data-animate="fade-up"
        >
          Trusted by forward-thinking companies
        </p>

        {/* 3 Client Logos */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start justify-items-center mb-24"
          data-animate="stagger"
        >
          {clients.map((client) => {
            const isActive = activeClient === client.name;

            return (
              <div
                key={client.name}
                className="relative w-full flex flex-col items-center"
                onMouseEnter={() => setActiveClient(client.name)}
                onMouseLeave={() => setActiveClient(null)}
              >
                {/* Logo */}
                <div className="relative flex items-center justify-center h-28 max-w-[240px] w-full cursor-pointer">
                  <Image
                    src={client.src}
                    alt={client.name}
                    width={200}
                    height={80}
                    className={`object-contain w-auto max-h-24 transition-all duration-500 ${
                      isActive
                        ? "brightness-100 invert-0 opacity-100"
                        : "brightness-0 invert opacity-40"
                    }`}
                    unoptimized
                  />
                </div>

                {/* Overlay Card */}
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[340px] z-30 transition-all duration-300 pointer-events-none ${
                    isActive
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  <div className="bg-[#111111] border border-white/[0.1] rounded-2xl p-6 shadow-2xl shadow-black/60">
                    {/* Arrow */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#111111] border-l border-t border-white/[0.1] rotate-45" />

                    <h4 className="text-white font-semibold text-lg mb-3">
                      {client.name}
                    </h4>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">
                      {client.description}
                    </p>
                    <div className="border-t border-white/[0.08] pt-3">
                      <p className="text-[#DC2626] text-xs uppercase tracking-widest font-semibold mb-1.5">
                        What we built
                      </p>
                      <p className="text-white/60 text-sm leading-relaxed">
                        {client.built}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonial */}
        <div className="text-center" data-animate="fade-up">
          <p className="text-2xl sm:text-3xl md:text-4xl text-white/80 leading-relaxed max-w-3xl mx-auto">
            &ldquo;Smart Scale delivered a platform that transformed how we
            operate. Their precision and attention to detail is
            unmatched.&rdquo;
          </p>
          <p className="mt-8 text-sm text-white/40 uppercase tracking-widest">
            — Enterprise Client
          </p>
        </div>
      </div>
    </section>
  );
}
