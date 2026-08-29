"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  REVIEWS,
  HAS_REVIEWS,
  reviewProjects,
  type Review,
} from "@/data/reviews";
import type { Project } from "@/data/projects";
import { GBP_URL } from "@/lib/business";

/**
 * The Google reviews wall.
 *
 * Two presentations, chosen by how many reviews exist:
 *
 *  - Under MARQUEE_MIN, a static centred grid. A marquee needs a track at
 *    least as wide as the viewport to loop seamlessly; with a handful of
 *    cards it would leave a visible gap on every pass.
 *  - At or above it, two CSS-only marquee rows drifting in opposite
 *    directions. They pause on hover, on keyboard focus, and while the modal
 *    is open, and they fall back to a swipeable strip on touch devices and
 *    under prefers-reduced-motion — a moving card you cannot hover is a
 *    click target nobody can hit.
 *
 * Cards carry a shortened preview so more of the wall fits on screen; the
 * full text, verbatim, is one click away in the modal. Each card also links
 * to the work that reviewer hired us for, which turns the section from a
 * dead end into a route to the portfolio.
 *
 * Renders nothing when there are no reviews, so it is safe to leave mounted.
 */

/** Below this, a scrolling track can't fill a wide viewport without gaps. */
const MARQUEE_MIN = 5;

/** Characters of review text on a card before it gets a "see full" link. */
const PREVIEW_CHARS = 145;

/**
 * Cuts to the last whole word inside the budget. Reviews are quoted, so a
 * preview that ends mid-word reads like a rendering bug rather than a choice.
 */
function previewOf(text: string): { preview: string; truncated: boolean } {
  if (text.length <= PREVIEW_CHARS) return { preview: text, truncated: false };
  const slice = text.slice(0, PREVIEW_CHARS);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > PREVIEW_CHARS * 0.6 ? slice.slice(0, lastSpace) : slice;
  return { preview: `${cut.replace(/[\s,;:.!?-]+$/, "")}…`, truncated: true };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`w-3.5 h-3.5 ${
            i < rating ? "fill-[#FBBC04]" : "fill-white/15"
          }`}
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </div>
  );
}

/** ISO dates get a friendly month/year; anything else passes through. */
function formatDate(date?: string): string | null {
  if (!date) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 shrink-0">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 01-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 01-10.7-3.8h-4v3.1A12 12 0 0012 24z"
      />
      <path
        fill="#FBBC04"
        d="M5.3 14.3a7.1 7.1 0 010-4.6v-3.1h-4a12 12 0 000 10.8z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 001.3 6.6l4 3.1A7.2 7.2 0 0112 4.8z"
      />
    </svg>
  );
}

function Avatar({ author }: { author: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center w-9 h-9 rounded-full bg-[#DC2626]/15 text-[#DC2626] text-sm font-medium shrink-0"
    >
      {author.trim().charAt(0).toUpperCase()}
    </span>
  );
}

/** The work behind the review, linked. `inert` for the marquee's clone row. */
function ProjectLinks({
  projects,
  inert = false,
}: {
  projects: Project[];
  inert?: boolean;
}) {
  if (projects.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {projects.map((project) => (
        <Link
          key={project.slug}
          href={`/portfolio/${project.slug}`}
          tabIndex={inert ? -1 : undefined}
          className="group/pill inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[0.7rem] text-white/50 transition-colors duration-300 hover:border-[#DC2626]/40 hover:bg-[#DC2626]/10 hover:text-white/85"
        >
          {project.title}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            className="w-2.5 h-2.5 opacity-50 transition-opacity duration-300 group-hover/pill:opacity-100"
          >
            <path
              d="M7 17L17 7M17 7H8M17 7v9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  variant = "marquee",
  inert = false,
  onOpen,
}: {
  review: Review;
  variant?: "marquee" | "static";
  /** True for the marquee's duplicated row, which is hidden from screen readers. */
  inert?: boolean;
  onOpen: (review: Review, trigger: HTMLElement) => void;
}) {
  const when = formatDate(review.date);
  const isStatic = variant === "static";
  const { preview, truncated } = previewOf(review.text);
  const projects = reviewProjects(review);

  return (
    <figure
      className={`review-card relative flex h-full flex-col rounded-2xl border border-white/[0.08] bg-[#111111] transition-colors duration-500 hover:border-white/20 ${
        isStatic
          ? "w-full p-6 sm:p-7"
          : "flex-shrink-0 w-[290px] sm:w-[330px] p-6"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <Stars rating={review.rating} />
        <GoogleMark />
      </div>

      <blockquote className="mt-4 flex-1">
        <p className="text-[0.9rem] leading-relaxed text-white/75">
          &ldquo;{preview}&rdquo;
        </p>
      </blockquote>

      {truncated && (
        <button
          type="button"
          tabIndex={inert ? -1 : undefined}
          onClick={(e) => onOpen(review, e.currentTarget)}
          className="mt-3 inline-flex items-center gap-1.5 self-start text-xs uppercase tracking-widest text-white/40 transition-colors duration-300 hover:text-white"
        >
          See full review
          <span aria-hidden="true">&rarr;</span>
          <span className="sr-only">from {review.author}</span>
        </button>
      )}

      <figcaption className="mt-6 border-t border-white/[0.06] pt-5">
        <div className="flex items-center gap-3">
          <Avatar author={review.author} />
          <span className="text-sm text-white/60">
            {review.author}
            {(when || review.context) && (
              <span className="block text-xs text-white/30">
                {[review.context, when].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
        </div>
        <ProjectLinks projects={projects} inert={inert} />
      </figcaption>
    </figure>
  );
}

function ReviewModal({
  review,
  onClose,
}: {
  review: Review;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const when = formatDate(review.date);
  const projects = reviewProjects(review);

  useEffect(() => {
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // Lenis drives the page scroll, so locking the body is what actually
    // stops the page drifting behind the panel.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="review-modal fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-author"
      onClick={onClose}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <div
        // Stops a click inside the panel from reaching the backdrop handler.
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
        className="review-modal-panel relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.10] bg-[#111111] p-7 sm:p-9"
      >
        <div className="flex items-start justify-between gap-4">
          <Stars rating={review.rating} />
          <div className="flex items-center gap-3">
            <GoogleMark />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close review"
              className="-mr-1 -mt-1 rounded-full p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <blockquote className="mt-6">
          <p className="text-base leading-relaxed text-white/80 sm:text-lg">
            &ldquo;{review.text}&rdquo;
          </p>
        </blockquote>

        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <div className="flex items-center gap-3">
            <Avatar author={review.author} />
            <span id="review-modal-author" className="text-sm text-white/70">
              {review.author}
              {(when || review.context) && (
                <span className="block text-xs text-white/30">
                  {[review.context, when].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
          </div>

          {projects.length > 0 && (
            <>
              <p className="mt-6 text-xs uppercase tracking-widest text-white/30">
                What we built
              </p>
              <ProjectLinks projects={projects} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({
  reviews,
  reverse = false,
  onOpen,
}: {
  reviews: Review[];
  reverse?: boolean;
  onOpen: (review: Review, trigger: HTMLElement) => void;
}) {
  if (reviews.length === 0) return null;
  // Duplicated once so the translate loop has an invisible seam. The copy is
  // hidden from assistive tech so reviews are not announced twice, and its
  // controls are taken out of the tab order so keyboard users don't walk
  // through the same review twice either.
  return (
    <div className="review-marquee group flex overflow-hidden">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1 ? "true" : undefined}
          className={`review-marquee-track flex gap-5 pr-5 ${
            reverse ? "review-marquee-track--reverse" : ""
          }`}
        >
          {reviews.map((review, i) => (
            <ReviewCard
              key={`${review.author}-${i}`}
              review={review}
              inert={copy === 1}
              onOpen={onOpen}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Reviews() {
  const [active, setActive] = useState<Review | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openReview = useCallback((review: Review, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setActive(review);
  }, []);

  const closeReview = useCallback(() => {
    setActive(null);
    // Send focus back where it came from, so a keyboard user does not land
    // at the top of the document after reading one review.
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);

  if (!HAS_REVIEWS) return null;

  const useMarquee = REVIEWS.length >= MARQUEE_MIN;
  const midpoint = Math.ceil(REVIEWS.length / 2);
  // Three reviews in a two-column grid leaves an orphan on its own row.
  const threeUp = REVIEWS.length === 3;

  return (
    <section
      className={`relative py-32 bg-[#0A0A0A] noise-overlay overflow-hidden ${
        active ? "reviews-paused" : ""
      }`}
      data-theme="dark"
      aria-labelledby="reviews-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="text-center text-white/40 text-sm uppercase tracking-widest mb-4">
          Reviews on Google
        </p>
        <h2
          id="reviews-heading"
          className="text-4xl sm:text-5xl md:text-6xl text-white text-center mb-6"
          data-animate="word-reveal"
        >
          What our clients say
        </h2>
        <p className="text-center text-white/50 max-w-xl mx-auto mb-16">
          Unedited reviews from the businesses we&apos;ve built for.
        </p>
      </div>

      {useMarquee ? (
        <div className="relative z-10 space-y-5">
          <MarqueeRow reviews={REVIEWS.slice(0, midpoint)} onOpen={openReview} />
          <MarqueeRow
            reviews={REVIEWS.slice(midpoint)}
            reverse
            onOpen={openReview}
          />

          <div
            aria-hidden="true"
            className="review-marquee-fade pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-[#0A0A0A] to-transparent"
          />
          <div
            aria-hidden="true"
            className="review-marquee-fade pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-[#0A0A0A] to-transparent"
          />
        </div>
      ) : (
        <div
          className={`mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${
            threeUp ? "max-w-6xl" : "max-w-5xl"
          }`}
        >
          {/* items-stretch keeps a short review's card the same height as a
              long one, so the row reads as a pair rather than a mistake.
              An odd count goes three-up rather than leaving the last card
              stranded alone on a second row. */}
          <div
            className={`grid grid-cols-1 gap-6 items-stretch ${
              threeUp ? "lg:grid-cols-3" : "md:grid-cols-2"
            }`}
            data-animate="stagger"
          >
            {REVIEWS.map((review, i) => (
              <ReviewCard
                key={`${review.author}-${i}`}
                review={review}
                variant="static"
                onOpen={openReview}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 mt-16 text-center px-4">
        <a
          href={GBP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-white/50 hover:text-white border-b border-white/20 hover:border-white/50 pb-1 transition-colors duration-300"
        >
          Read all reviews on Google
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            className="w-3.5 h-3.5"
          >
            <path
              d="M7 17L17 7M17 7H8M17 7v9"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <p className="mt-6 text-xs text-white/25">
          Worked with us?{" "}
          <Link href="/contact" className="underline underline-offset-4">
            Get in touch
          </Link>{" "}
          &mdash; or leave a review on Google.
        </p>
      </div>

      {active && <ReviewModal review={active} onClose={closeReview} />}
    </section>
  );
}
