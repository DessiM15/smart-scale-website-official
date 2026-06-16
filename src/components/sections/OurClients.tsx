"use client";

import SectionHeading from "@/components/ui/SectionHeading";

const clientNames = [
  "Bloxify",
  "Lomeli Financial Group",
  "Gulf Coast Alloys",
  "Botmakers",
  "Taylor Made Esthetics",
  "Fight My Repo",
  "Repo911",
  "Valor Financial Advisors",
  "APEX Affinity Group",
  "Mex Taco House",
];

export default function OurClients() {
  // Double the list for seamless loop
  const doubled = [...clientNames, ...clientNames];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title="Trusted Partners"
          subtitle="Companies that trust us to deliver enterprise-quality solutions."
        />
      </div>

      {/* Marquee */}
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-12 whitespace-nowrap w-max">
          {doubled.map((name, index) => (
            <span
              key={index}
              className="text-2xl md:text-3xl font-semibold text-white/20 hover:text-white/50 transition-colors duration-300 select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
