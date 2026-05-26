"use client";

import { useState } from "react";
import Image from "next/image";

const capabilities = [
  {
    title: "Web Applications",
    description:
      "Full-stack platforms built for performance, security, and scale.",
    image: "/assets/portfolio/botmakers-crm/thumbnail.webp",
  },
  {
    title: "Mobile",
    description:
      "Native and cross-platform apps that deliver seamless experiences.",
    image: "/assets/portfolio/bloxify-landing/thumbnail.webp",
  },
  {
    title: "AI Systems",
    description:
      "Intelligent automation, NLP, and machine learning solutions.",
    image: "/assets/portfolio/repo911/thumbnail.webp",
  },
  {
    title: "Enterprise Platforms",
    description:
      "Mission-critical systems engineered for reliability at scale.",
    image: "/assets/portfolio/gulf-coast-alloys/thumbnail.webp",
  },
  {
    title: "Integrations",
    description:
      "Seamless API connections and automated data workflows.",
    image: "/assets/portfolio/teachers-pension/thumbnail.webp",
  },
  {
    title: "Digital Strategy",
    description:
      "Technical architecture and roadmap consulting for growth.",
    image: "/assets/portfolio/valor-financial/thumbnail.webp",
  },
];

export default function Capabilities() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-[#111111]">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-4xl sm:text-5xl md:text-6xl text-white text-center mb-4"
          data-animate="fade-up"
        >
          Capabilities
        </h2>
        <p
          className="text-center text-white/50 text-lg mb-20 max-w-2xl mx-auto"
          data-animate="fade-up"
        >
          End-to-end engineering for businesses that demand excellence.
        </p>

        {/* Desktop: Expanding vertical columns */}
        <div
          className="hidden lg:flex h-[520px] gap-[2px] rounded-2xl overflow-hidden"
          data-animate="fade-up"
          onMouseLeave={() => setActiveIndex(null)}
        >
          {capabilities.map((cap, index) => {
            const isActive = activeIndex === index;
            const isAnyActive = activeIndex !== null;

            return (
              <div
                key={cap.title}
                className="relative overflow-hidden cursor-pointer"
                style={{
                  flex: isActive ? 4 : isAnyActive ? 0.6 : 1,
                  transition: "flex 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {/* Background image */}
                <Image
                  src={cap.image}
                  alt={cap.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out"
                  style={{
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                  }}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  unoptimized
                />

                {/* Dark overlay */}
                <div
                  className="absolute inset-0 transition-all duration-600"
                  style={{
                    background: isActive
                      ? "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)"
                      : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 100%)",
                  }}
                />

                {/* Subtle red accent line on active */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#DC2626] transition-opacity duration-500"
                  style={{ opacity: isActive ? 1 : 0 }}
                />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3
                    className="text-white font-medium transition-all duration-500 whitespace-nowrap"
                    style={{
                      fontSize: isActive ? "1.75rem" : "0.875rem",
                      letterSpacing: isActive ? "0" : "0.05em",
                      textTransform: isActive ? "none" : "uppercase",
                      marginBottom: isActive ? "0.75rem" : "0",
                    }}
                  >
                    {cap.title}
                  </h3>
                  <p
                    className="text-white/60 leading-relaxed transition-all duration-500"
                    style={{
                      opacity: isActive ? 1 : 0,
                      maxHeight: isActive ? "80px" : "0",
                      fontSize: "0.875rem",
                      overflow: "hidden",
                    }}
                  >
                    {cap.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile/Tablet: Stacked cards with images */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden"
          data-animate="stagger"
        >
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="group relative h-52 rounded-2xl overflow-hidden"
            >
              <Image
                src={cap.image}
                alt={cap.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 50vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <h3 className="text-lg text-white mb-1">{cap.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
