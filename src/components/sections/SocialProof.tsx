"use client";

import Image from "next/image";

const clientLogos = [
  { name: "Botmakers", src: "/assets/client-logos/botmakers.png" },
  { name: "Gulf Coast Alloys", src: "/assets/client-logos/gulf-coast-alloys.png" },
  { name: "APEX Affinity", src: "/assets/client-logos/apex-affinity.png" },
];

export default function SocialProof() {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] noise-overlay" data-theme="dark">
      <div className="max-w-6xl mx-auto relative z-10">
        <p
          className="text-center text-white/40 text-sm uppercase tracking-widest mb-16"
          data-animate="fade-up"
        >
          Trusted by businesses across the Houston metro
        </p>

        {/* Client logos */}
        <div
          className="flex items-center justify-center gap-16 sm:gap-20 md:gap-28"
          data-animate="stagger"
        >
          {clientLogos.map((client) => (
            <div
              key={client.name}
              className="group relative flex items-center justify-center h-28 w-[240px]"
            >
              <Image
                src={client.src}
                alt={`${client.name} \u2014 Smart Scale client`}
                width={220}
                height={90}
                className="object-contain w-auto max-h-24 transition-all duration-500 brightness-0 invert opacity-40 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
