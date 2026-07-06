"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import Link from "next/link";
import { getFeaturedProjects } from "@/data/projects";

const featured = getFeaturedProjects();

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryInnerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Entry animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.2 }
      );
      gsap.fromTo(
        logoRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.4 }
      );
      if (galleryRef.current) {
        gsap.fromTo(
          galleryRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1, ease: "power3.out", delay: 0.6 }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-scrolling gallery
  useEffect(() => {
    const inner = galleryInnerRef.current;
    if (!inner) return;

    // Calculate single set height (half of duplicated content)
    const singleSetHeight = inner.scrollHeight / 2;

    const tween = gsap.to(inner, {
      y: -singleSetHeight,
      duration: singleSetHeight / 40, // speed: 40px/s
      ease: "none",
      repeat: -1,
      modifiers: {
        y: gsap.utils.unitize((y: number) => {
          return parseFloat(y as unknown as string) % singleSetHeight;
        }),
      },
    });

    if (isPaused) {
      tween.pause();
    }

    return () => {
      tween.kill();
    };
  }, [isPaused]);

  // Duplicate items for seamless loop
  const galleryItems = [...featured, ...featured];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-white overflow-hidden"
      data-theme="light"
    >
      {/* Subtle red gradient orb */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-[#DC2626]/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex flex-col lg:flex-row items-stretch">
        {/* Left side — logo + subtitle */}
        <div className="flex-1 lg:flex-[0_0_60%] flex flex-col justify-between pt-32 pb-12 lg:pb-20 overflow-hidden">
          <p
            ref={subtitleRef}
            className="text-xs sm:text-sm uppercase tracking-[0.25em] text-black/50 font-light opacity-0"
          >
            Precision Software for Enterprise
          </p>

          <div
            ref={logoRef}
            className="opacity-0 select-none"
          >
            <Image
              src="/assets/smart-scale-logo-official.png"
              alt="Smart Scale"
              width={800}
              height={800}
              className="w-full max-w-[600px] lg:max-w-[720px] h-auto"
              priority
              sizes="(max-width: 1024px) 100vw, 720px"
            />
          </div>
        </div>

        {/* Right side — auto-scrolling gallery (hidden on mobile) */}
        <div
          ref={galleryRef}
          className="hidden lg:flex flex-[0_0_40%] items-center justify-center overflow-hidden opacity-0 py-24"
          data-parallax="0.15"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative w-full h-full overflow-hidden">
            <div ref={galleryInnerRef} className="flex flex-col gap-6">
              {galleryItems.map((project, i) => (
                <Link
                  key={`${project.slug}-${i}`}
                  href={`/portfolio/${project.slug}`}
                  className="group block flex-shrink-0"
                >
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#F0F0F0]">
                    <Image
                      src={project.thumbnailImage}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </div>
                  <p className="mt-3 text-sm text-black/60 group-hover:text-black transition-colors duration-300">
                    {project.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
