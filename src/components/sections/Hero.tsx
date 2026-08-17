"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/data/projects";
import { REVIEWS } from "@/data/reviews";
import { GBP_URL } from "@/lib/business";

/**
 * The homepage hero.
 *
 * Deliberately leads with the headline, not the logo. The navbar already
 * carries the mark; a 500px logo in the middle of the fold reads as a splash
 * screen and — more practically — consumed so much vertical space that the H1
 * was being clipped by the column's overflow on laptop-height viewports.
 *
 * The section is min-height rather than fixed height for the same reason: it
 * grows on short screens instead of guillotining the last line of the H1.
 */

/** Every project, so the hero reads as the full body of work. */
const galleryProjects = projects;

/** Average Google rating, derived so the copy can't drift from the data. */
const avgRating =
  REVIEWS.reduce((sum, r) => sum + r.rating, 0) / (REVIEWS.length || 1);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryInnerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Entry animations — the copy cluster rises as one unit so the eyebrow,
  // headline and CTAs read as a single typographic block rather than a
  // sequence of unrelated elements.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = copyRef.current?.querySelectorAll("[data-hero-item]");
      if (items?.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.08,
            delay: 0.15,
          }
        );
      }
      if (galleryRef.current) {
        gsap.fromTo(
          galleryRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1.2, ease: "power2.out", delay: 0.5 }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-scrolling gallery.
  useEffect(() => {
    const inner = galleryInnerRef.current;
    if (!inner) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Single set height = half the duplicated content.
    const singleSetHeight = inner.scrollHeight / 2;
    if (!singleSetHeight) return;

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

    if (isPaused) tween.pause();

    return () => {
      tween.kill();
    };
  }, [isPaused]);

  // Duplicated for a seamless loop. The copy is hidden from assistive tech so
  // the same projects aren't announced twice.
  const galleryItems = [...galleryProjects, ...galleryProjects];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center bg-[#0A0A0A] noise-overlay overflow-hidden"
      data-theme="dark"
    >
      {/* Warm red bloom behind the type. Inline because Tailwind has no
          radial-gradient utility here — the previous `bg-gradient-radial`
          class matched nothing and rendered nothing. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/2 h-[900px] w-[900px] -translate-y-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(220,38,38,0.16) 0%, rgba(220,38,38,0.04) 45%, transparent 70%)",
        }}
      />

      {/* The vertical rhythm is height-aware, not just width-aware: at 1280x720
          the fixed padding pushed the proof line past the fold. Clamped inline
          rather than via stacked `lg:` + `max-height` variants, whose source
          order — and therefore which one wins — isn't guaranteed. The lower
          bound still clears the 96px navbar. */}
      <div
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{
          paddingTop: "clamp(7rem, 14vh, 10rem)",
          paddingBottom: "clamp(4rem, 10vh, 7rem)",
        }}
      >
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.68fr)] gap-16 xl:gap-24 items-center">
          {/* ===== Left — the statement ===== */}
          <div ref={copyRef}>
            {/* The rule is inline rather than a flex sibling so that on a
                narrow phone the eyebrow wraps *under* it, instead of the rule
                floating at the vertical centre of a two-line block. */}
            <p
              data-hero-item
              className="opacity-0 text-[10px] tracking-[0.2em] uppercase text-white/45 sm:text-xs sm:tracking-[0.3em]"
            >
              <span
                aria-hidden="true"
                className="mr-4 inline-block h-px w-10 align-middle bg-white/25"
              />
              Web Design &amp; Local SEO &mdash; Katy, TX
            </p>

            {/* The page's single H1. max-w in ch so the line breaks land in a
                deliberate place instead of wherever the viewport decides. */}
            <h1
              data-hero-item
              className="mt-8 opacity-0 leading-[1.06] text-white max-w-[13ch] tracking-[-0.015em]"
              style={{ fontSize: "clamp(2.5rem, min(4.4vw, 7.6vh), 4.75rem)" }}
            >
              Websites That Get Houston Businesses{" "}
              <span className="italic text-[#F87171]">Found</span>
            </h1>

            <p
              data-hero-item
              className="mt-7 opacity-0 text-base sm:text-lg text-white/55 leading-relaxed max-w-[44ch]"
            >
              We build fast, mobile-first websites for local businesses across
              Katy, Cypress, Houston, Sugar Land, Richmond, and Fulshear
              &mdash; then keep them ranking.
            </p>

            <div
              data-hero-item
              className="mt-10 opacity-0 flex flex-wrap items-center gap-x-8 gap-y-4"
            >
              <Link
                href="/portfolio"
                className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-[#0A0A0A] transition-colors duration-300 hover:bg-[#DC2626] hover:text-white"
              >
                See the work
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="border-b border-white/25 pb-1 text-xs uppercase tracking-[0.2em] text-white/60 transition-colors duration-300 hover:border-white/60 hover:text-white"
              >
                Get in touch
              </Link>
            </div>

            {/* Social proof, above the fold. Display only — never marked up as
                Review/AggregateRating JSON-LD; see src/data/reviews.ts. */}
            {REVIEWS.length > 0 && (
              <a
                data-hero-item
                href={GBP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-10 inline-flex items-center gap-3 opacity-0"
              >
                <span
                  className="flex gap-0.5"
                  role="img"
                  aria-label={`${avgRating.toFixed(1)} out of 5 stars`}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      className="w-3.5 h-3.5 fill-[#FBBC04]"
                    >
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" />
                    </svg>
                  ))}
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-white/40 transition-colors duration-300 group-hover:text-white/70">
                  {avgRating.toFixed(1)} on Google &middot; {REVIEWS.length}{" "}
                  {REVIEWS.length === 1 ? "review" : "reviews"}
                </span>
              </a>
            )}
          </div>

          {/* ===== Right — the work, drifting ===== */}
          <div
            ref={galleryRef}
            className="hidden lg:block opacity-0"
            data-parallax="0.12"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* The mask dissolves the track into the background at both ends,
                so a thumbnail never collides with the navbar or the section
                edge the way a hard-cropped column did. */}
            <div
              className="relative h-[64vh] max-h-[660px] min-h-[420px] overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
              }}
            >
              <div ref={galleryInnerRef} className="flex flex-col gap-6">
                {galleryItems.map((project, i) => {
                  const isClone = i >= galleryProjects.length;
                  return (
                    <Link
                      key={`${project.slug}-${i}`}
                      href={`/portfolio/${project.slug}`}
                      aria-hidden={isClone ? "true" : undefined}
                      tabIndex={isClone ? -1 : undefined}
                      className="group block flex-shrink-0"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111111] transition-colors duration-500 group-hover:border-white/25">
                        <Image
                          src={project.thumbnailImage}
                          alt={`${project.title} website designed by Smart Scale — ${project.industry}`}
                          fill
                          className="object-cover opacity-85 transition-all duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
                          sizes="(max-width: 1024px) 0px, 460px"
                        />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-4">
                        <p className="text-sm text-white/60 transition-colors duration-300 group-hover:text-white">
                          {project.title}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                          {project.industry}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
