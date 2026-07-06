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
          Trusted by forward-thinking companies
        </p>

        {/* Client logos */}
        <div
          className="flex items-center justify-center gap-16 sm:gap-20 md:gap-28 mb-24"
          data-animate="stagger"
        >
          {clientLogos.map((client) => (
            <div
              key={client.name}
              className="group relative flex items-center justify-center h-28 w-[240px]"
            >
              <Image
                src={client.src}
                alt={client.name}
                width={220}
                height={90}
                className="object-contain w-auto max-h-24 transition-all duration-500 brightness-0 invert opacity-40 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0"
              />
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="text-center" data-animate="scale-reveal">
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
