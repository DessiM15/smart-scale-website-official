import Link from "next/link";
import { BOOKING_URL } from "@/lib/business";

export default function Closing() {
  return (
    <section className="bg-[#0C0B0A] px-4 pb-16 pt-24 text-center sm:px-6 sm:pt-36 lg:px-8" data-theme="dark">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Start</p>
        <h2 className="mt-4 text-[clamp(42px,7vw,104px)] leading-[1] text-white">
          Let&apos;s build the site your customers <em className="italic text-[#DC2626]">find first.</em>
        </h2>
        <p className="mx-auto mt-6 max-w-[30em] text-white/65">One call. A scope and a price in writing. No obligation.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
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
            href="/blog/how-much-does-a-website-cost-katy-houston"
            className="inline-flex items-center rounded-full border border-white/[0.16] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#0C0B0A]"
          >
            How we price a website
          </Link>
        </div>
      </div>
    </section>
  );
}
