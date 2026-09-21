import { BOOKING_EMBED_URL, BOOKING_URL } from "@/lib/business";

/**
 * The Google Calendar appointment picker, embedded, with a plain link
 * underneath for anyone whose browser blocks the frame. The link carries
 * data-track so GA4 counts the click as a cta_click.
 */
export default function BookCall() {
  return (
    <section
      id="book-a-call"
      data-theme="light"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl text-[#111111] mb-4">
          Book a call
        </h2>
        <p className="text-lg text-black/50 mb-10 max-w-2xl">
          Pick a time that suits you. Thirty minutes, on the phone or on
          video. You leave with a scope and a price in writing, and no
          obligation.
        </p>
        <div className="rounded-2xl overflow-hidden border border-black/[0.08] bg-white">
          <iframe
            src={BOOKING_EMBED_URL}
            title="Book a call with Smart Scale"
            className="w-full h-[720px]"
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>
        <p className="mt-6 text-black/50">
          Calendar not loading?{" "}
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-track="book_call"
            className="text-[#DC2626] underline underline-offset-4"
          >
            Open the booking page
          </a>
          .
        </p>
      </div>
    </section>
  );
}
