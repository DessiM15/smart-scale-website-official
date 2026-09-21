import Image from "next/image";
import Link from "next/link";
import { REVIEWS } from "@/data/reviews";

/**
 * Restaurant advertising, and the offer to venues. Donna Washington's
 * review lives here rather than on the reviews wall because she is an
 * advertising client; any review whose links point at /advertise is
 * treated the same way.
 */
export function advertisingReviews() {
  return REVIEWS.filter((r) => r.links?.some((l) => l.href === "/advertise"));
}

export default function Advertising() {
  const quote = advertisingReviews()[0];
  return (
    <section className="mt-20 border-y border-white/[0.16] bg-[#131211] px-4 sm:mt-28 sm:px-6 lg:px-8" data-theme="dark">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">Mex Taco House · Cypress, TX</p>
            <h2 className="mt-4 text-[clamp(36px,4.6vw,64px)] leading-[1.05] text-white">
              Restaurant <em className="italic text-[#DC2626]">Advertisements.</em>
            </h2>
            <p className="mt-5 max-w-[32em] text-white/65">
              Your ad on the dining-room screens at Mex Taco House, in front of a full house every day. One business per category. We design the ad, you own the room.
            </p>
            <p className="mt-6">
              <Link
                href="/advertise"
                data-track="advertise_cta"
                className="inline-flex items-center rounded-full bg-[#DC2626] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#B91C1C]"
              >
                Advertise at Mex Taco House
              </Link>
            </p>
            {quote && (
              <blockquote className="mt-7 rounded-xl border border-white/[0.09] bg-[#0C0B0A] p-7">
                <p className="text-[clamp(18px,1.6vw,22px)] leading-snug text-white">
                  <span aria-hidden="true" className="mr-1 text-[#DC2626]">&ldquo;</span>
                  {quote.text}
                </p>
                <footer className="mt-4 text-sm text-white/65">
                  <b className="block font-semibold text-white">{quote.author}</b>
                  Advertiser at Mex Taco House · Google review
                </footer>
              </blockquote>
            )}
          </div>
          <Image
            src="/images/screens-wall.jpg"
            alt="Mex Taco House dining room in Cypress with an Andre Thomas Law ad on the wall TVs"
            width={2000}
            height={1500}
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="w-full rounded-[10px] border border-white/[0.16]"
          />
        </div>

        <div className="grid items-center gap-8 border-t border-white/[0.09] py-10 sm:py-14 lg:grid-cols-[7fr_5fr] lg:gap-16">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-[#DC2626]">Restaurant and venue owners</p>
            <h3 className="mt-3 text-[clamp(26px,2.8vw,40px)] leading-tight text-white">
              Your restaurant has a wall. <em className="italic text-[#DC2626]">We&apos;ll pay rent on it.</em>
            </h3>
            <p className="mt-3 max-w-[40em] text-white/65">
              We install the screens, sell the ads, design every spot and handle every advertiser. You collect rent every month for space you already own. Zero cost, zero work.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-sm uppercase tracking-[0.1em] text-white">
              {["Zero cost to you", "We pay you rent", "We handle everything"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Link
              href="/contact"
              data-track="venue_cta"
              className="inline-flex items-center rounded-full bg-[#DC2626] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#B91C1C]"
            >
              Talk to us about your venue
            </Link>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">Mex Taco House was first. Yours could be next.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
