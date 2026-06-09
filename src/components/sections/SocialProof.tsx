"use client";

import Image from "next/image";

const clientLogos = [
  { name: "Botmakers", src: "/assets/client-logos/botmakers.png", size: "default" as const },
  { name: "Gulf Coast Alloys", src: "/assets/client-logos/gulf-coast-alloys.png", size: "default" as const },
  { name: "Repo911", src: "/assets/client-logos/repo911.svg", size: "default" as const },
  { name: "Valor Financial", src: "/assets/client-logos/valor-financial.png", size: "default" as const },
  { name: "APEX Affinity", src: "/assets/client-logos/apex-affinity.png", size: "default" as const },
  { name: "Teachers Pension", src: "/assets/client-logos/teachers-pension.png", size: "default" as const },
  { name: "Bloxify", src: "/assets/client-logos/bloxify.png", size: "default" as const },
  { name: "Lomeli Financial", src: "/assets/client-logos/lomeli-financial.png", size: "large" as const },
  { name: "Fight My Repo", src: "/assets/client-logos/fight-my-repo.svg", size: "default" as const },
  { name: "Taylor Made Esthetics", src: "/assets/client-logos/taylor-made-esthetics.png", size: "large" as const },
  { name: "Mex Taco House", src: "/assets/client-logos/mex-taco-house.png", size: "default" as const },
];

export default function SocialProof() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]" data-theme="dark">
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
              className={`group relative flex items-center justify-center w-full ${
                client.size === "large"
                  ? "h-24 max-w-[220px]"
                  : "h-16 max-w-[180px]"
              }`}
            >
              <Image
                src={client.src}
                alt={client.name}
                width={client.size === "large" ? 200 : 160}
                height={client.size === "large" ? 80 : 56}
                className={`object-contain w-auto transition-all duration-500 brightness-0 invert opacity-40 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0 ${
                  client.size === "large" ? "max-h-20" : "max-h-14"
                }`}
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
