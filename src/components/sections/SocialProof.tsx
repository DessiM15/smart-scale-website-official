"use client";

const clients = [
  "Bloxify",
  "Botmakers",
  "Gulf Coast Alloys",
  "Teachers Pension",
  "Repo911",
  "Lomeli Financial",
  "Valor Financial",
  "APEX Affinity",
  "Taylor Made Esthetics",
  "Mex Taco House",
];

export default function SocialProof() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
      <div className="max-w-5xl mx-auto">
        <p
          className="text-center text-white/40 text-sm uppercase tracking-widest mb-16"
          data-animate="fade-up"
        >
          Trusted by forward-thinking companies
        </p>

        {/* Client logo grid (text-based, grayscale style) */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 items-center justify-items-center mb-20"
          data-animate="stagger"
        >
          {clients.map((client) => (
            <span
              key={client}
              className="text-sm md:text-base text-white/25 font-medium tracking-wide hover:text-white/50 transition-colors duration-300 text-center"
            >
              {client}
            </span>
          ))}
        </div>

        {/* Testimonial placeholder */}
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
