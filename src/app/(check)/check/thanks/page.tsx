import type { Metadata } from "next";
import { BOOKING_EMBED_URL, BOOKING_URL, BUSINESS } from "@/lib/business";
import { eyebrow, lede, textLink } from "../_components/ui";

export const metadata: Metadata = {
  title: "Thank You",
  robots: { index: false, follow: false },
};

const STEPS = [
  "One of us calls you within one business day.",
  "We talk through what you need and what would help first.",
  "You get a plan in writing. There is no obligation.",
];

/** After a fix request or the no-website form: what happens next, and the calendar. */
export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const fix = (await searchParams).for === "fix";
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className={eyebrow}>{fix ? "Request received" : "We got it"}</p>
        <h1 className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08]">We&apos;ll call you within one business day.</h1>
        <p className={`mt-6 ${lede}`}>
          {fix ? "Thanks for asking us to fix your site." : "Thanks for telling us about your business."} Here is what happens next.
        </p>
        <ol className="mt-8 space-y-3 text-white/80">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="font-mono text-sm text-[#EF4444]">{i + 1}</span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-14 text-2xl">Rather pick a time now?</h2>
        <p className="mt-4 leading-relaxed text-white/65">Choose a slot below and the call is on both our calendars.</p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.09] bg-white">
          <iframe src={BOOKING_EMBED_URL} title="Book a call with Smart Scale" className="h-[720px] w-full" style={{ border: 0 }} loading="lazy" />
        </div>
        <p className="mt-6 text-white/65">
          Calendar not loading?{" "}
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" data-track="book_call" className={textLink}>
            Open the booking page<span className="sr-only"> (opens in a new tab)</span>
          </a>
          , or call{" "}
          <a href={BUSINESS.phone.href} className={textLink}>
            {BUSINESS.phone.display}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
