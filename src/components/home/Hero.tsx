import Image from "next/image";
import Link from "next/link";
import { projects } from "@/data/projects";
import { REVIEWS } from "@/data/reviews";
import { BOOKING_URL, GBP_URL } from "@/lib/business";

/**
 * The homepage opener, from the dark concept Dessi chose on 2026-09-21.
 *
 * The H1 is the one local query the site most wants to win. The two lines
 * under it carry what a headline can't: the metro, and the fact that
 * distance doesn't matter (two clients are out of state). The right side
 * is three live client sites in browser frames, the first thing a visitor
 * sees, so the proof is on screen before a word is read.
 */
const SHOWCASE = ["andre-thomas-law", "gin-and-jack", "ascension-athlete-group"] as const;

function Frame({
  slug,
  className,
  priority = false,
}: {
  slug: string;
  className: string;
  priority?: boolean;
}) {
  const project = projects.find((p) => p.slug === slug);
  if (!project) return null;
  return (
    <div
      className={`absolute overflow-hidden rounded-[10px] border border-white/[0.16] bg-[#1A1816] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] ${className}`}
    >
      <Image
        src={project.thumbnailImage}
        alt={`${project.title} website, built by Smart Scale`}
        fill
        priority={priority}
        sizes="(max-width: 900px) 90vw, 40vw"
        className="object-cover object-top"
      />
    </div>
  );
}

export default function Hero() {
  const rating = REVIEWS.length
    ? (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1)
    : null;
  const metro = projects.filter((p) => p.city?.endsWith(", TX")).length;

  return (
    <section
      className="relative overflow-hidden bg-[#0C0B0A] pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6 lg:px-8"
      data-theme="dark"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 50% at 20% 30%, rgba(220,38,38,0.14), transparent 60%)" }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[6.5fr_5.5fr] lg:gap-20">
        <div>
          <p className="flex items-center gap-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
            <span aria-hidden="true" className="inline-block h-px w-9 bg-[#DC2626]" />
            Web design &amp; local SEO · Katy, Cypress, Houston
          </p>
          <h1 className="mt-6 text-[clamp(48px,7.2vw,108px)] leading-[1] text-white">
            Website Design in <em className="not-italic font-normal italic text-[#DC2626]">Katy, TX.</em>
          </h1>
          <p className="mt-7 max-w-[32em] text-[17px] leading-relaxed text-white/65 sm:text-lg">
            Websites for Katy, Cypress and Houston businesses that need the phone to ring. Fixed price after one call. Most sites live in two weeks. You own every line of it.
          </p>
          <p className="mt-3 max-w-[36em] text-[15px] leading-relaxed text-white/40">
            Based in Katy. Most of our clients are across the Houston metro; some are in California and Tennessee, because a good website doesn&apos;t care where you are.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-track="book_call"
              className="inline-flex items-center rounded-full bg-[#DC2626] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#B91C1C]"
            >
              Book a call
            </a>
            <Link
              href="/portfolio"
              className="inline-flex items-center rounded-full border border-white/[0.16] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#0C0B0A]"
            >
              See the work
            </Link>
          </div>
          {rating && (
            <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/65">
              <a href={GBP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:text-white">
                <span aria-hidden="true" className="tracking-[2px] text-[#D9B26A]">★★★★★</span>
                <span>
                  <b className="font-semibold text-white">{rating} on Google</b> · {REVIEWS.length} reviews, unedited
                </span>
              </a>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
                {projects.length} projects · {metro} in the Houston metro
              </span>
            </p>
          )}
        </div>

        <div className="relative aspect-[16/11] lg:aspect-[4/3]" aria-label="Three live client websites">
          <Frame slug={SHOWCASE[0]} className="left-0 top-[6%] z-[2] h-[76%] w-[76%]" priority />
          <Frame slug={SHOWCASE[1]} className="right-0 top-0 z-[3] h-[44%] w-[46%]" />
          <Frame slug={SHOWCASE[2]} className="bottom-0 right-[4%] z-[1] h-[40%] w-[54%] opacity-90" />
          <span className="absolute bottom-[2%] left-0 z-[4] inline-flex items-center gap-2 rounded border border-white/[0.16] bg-[#0C0B0A] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-white">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#DC2626] shadow-[0_0_0_4px_rgba(220,38,38,0.16)]" />
            andrethomaslaw.com · Houston
          </span>
        </div>
      </div>
    </section>
  );
}
