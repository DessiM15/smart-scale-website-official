"use client";

import Image from "next/image";

const clientLogos = [
  { name: "Botmakers", src: "/assets/client-logos/botmakers.png" },
  { name: "Gulf Coast Alloys", src: "/assets/client-logos/gulf-coast-alloys.png" },
  { name: "Repo911", src: "/assets/client-logos/repo911.svg" },
  { name: "Valor Financial", src: "/assets/client-logos/valor-financial.png" },
  { name: "APEX Affinity", src: "/assets/client-logos/apex-affinity.png" },
  { name: "Teachers Pension", src: "/assets/client-logos/teachers-pension.png" },
  { name: "Bloxify", src: "/assets/client-logos/bloxify.png" },
  { name: "Lomeli Financial", src: "/assets/client-logos/lomeli-financial.png" },
  { name: "Fight My Repo", src: "/assets/client-logos/fight-my-repo.svg" },
  { name: "Taylor Made Esthetics", src: "/assets/client-logos/taylor-made-esthetics.png" },
  { name: "Mex Taco House", src: "/assets/client-logos/mex-taco-house.png" },
];

export default function SocialProof() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        <p
          className="text-center text-white/40 text-sm uppercase tracking-widest mb-16"
          data-animate="fade-up"
        >
          Trusted by forward-thinking companies
        </p>

        {/* Client logo grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-12 gap-y-10 items-center justify-items-center mb-24"
          data-animate="stagger"
        >
          {clientLogos.map((client) => (
            <div
              key={client.name}
              className="group relative flex items-center justify-center h-16 w-full max-w-[180px]"
            >
              <Image
                src={client.src}
                alt={client.name}
                width={160}
                height={56}
                className="object-contain max-h-14 w-auto transition-all duration-500 brightness-0 invert opacity-40 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0"
                unoptimized
              />
            </div>
          ))}
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
