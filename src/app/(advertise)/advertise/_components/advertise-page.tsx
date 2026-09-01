"use client";

/**
 * The advertise page: one decision, made as easy as possible.
 *
 * It used to be a catalogue. You browsed three priced tiers and picked one,
 * which asks a stranger to choose a contract before they have spoken to
 * anybody. It is now a lead page with a single offer, finding out whether
 * their category is still open, and every section below the fold exists to
 * answer a doubt about taking it.
 *
 * The offer used to be a free mockup. Design is now covered by the one-time
 * setup fee, so nothing on this page may promise it for nothing — a page that
 * gives away work the contract charges for is a page that argues with its own
 * invoice.
 *
 * The live half comes from the tracker. How many slots are left is read from
 * the roster on the server, so the page cannot claim a slot is going after it
 * has been sold.
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

export type AdvertisePageProps = {
  phoneDisplay: string;
  phoneHref: string;
  startingPrice: string;
  /** Every slot the rotation sells, taken or not. */
  totalSlots: number;
  /** Live from the roster. Null when the database could not be reached. */
  slotsLeft: number | null;
  metaPixelId?: string;
};

/**
 * The photographs, in the order the gallery walks through them. Captions name
 * the category, never the business: publishing a client's name is their
 * decision to give, not ours to assume.
 */
const GALLERY = [
  {
    src: "/images/screen-law.jpg",
    alt: "A personal injury law firm advertisement playing on a screen at Mex Taco House",
    caption: "Personal injury law",
    detail: "Running on the wall by the counter",
    position: "center 26%",
  },
  {
    src: "/images/screens-wall.jpg",
    alt: "Three screens above the dining room with a client advertisement playing",
    caption: "Three screens, one room",
    detail: "Every table has a view of at least one",
    position: "center 38%",
  },
  {
    src: "/images/screen-events.jpg",
    alt: "An events venue advertisement playing on a screen at Mex Taco House",
    caption: "Event venue",
    detail: "Weekends are when this one earns its keep",
    position: "center center",
  },
  {
    src: "/images/screen-wall-wide.jpg",
    alt: "The screens above the dining room at Mex Taco House",
    caption: "The dining room wall",
    detail: "Six in the morning until two, every day we open",
    position: "center center",
  },
];

const BUDGETS = [
  "Under $100 a month",
  "$100 to $250 a month",
  "$250 to $500 a month",
  "$500+ a month",
  "Not sure yet",
];

const TICKER = [
  { text: "AD DESIGN DONE FOR YOU", gold: true },
  { text: "ONE BUSINESS PER CATEGORY", gold: false },
  { text: "LIVE IN DAYS, NOT WEEKS", gold: true },
  { text: "10,000+ IMPRESSIONS A MONTH", gold: false },
];

const INCLUDED = [
  "Your ad designed and built for you",
  "A QR code we track, so you see the scans",
  "Your category locked while you run",
  "Artwork changes whenever you want",
  "A monthly report of how it performed",
  "One point of contact, start to finish",
];

const FAQ = [
  {
    q: "What does one per category mean?",
    a: "Once you take a category, no competitor can buy it while you are running. You own it. That is the whole point of advertising here rather than somewhere that sells to everyone.",
  },
  {
    q: "Who designs the ad?",
    a: "We do, and it is included. Before you pay anything, and every time you want it changed after that.",
  },
  {
    q: "How soon am I on screen?",
    a: "The next business day after you approve the artwork.",
  },
  {
    q: "What am I committing to?",
    a: "It depends which package you take. Terms start at three months, and the longer ones cost less per month. Whichever you choose is written into the agreement before anything starts, and we go through it with you on the call.",
  },
];

export default function AdvertisePage({
  phoneDisplay,
  phoneHref,
  startingPrice,
  totalSlots,
  slotsLeft,
  metaPixelId,
}: AdvertisePageProps) {
  useGSAPAnimations();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [source, setSource] = useState("advertise-page");

  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  /**
   * Which flyer or QR sent them. Read on the client because the page is cached
   * and the query string must not become part of what gets cached.
   */
  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get("src");
    if (src) setSource(src.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, ""));
  }, []);

  /** The gallery walks itself until someone takes hold of it. */
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(
      () => setSlide((n) => (n + 1) % GALLERY.length),
      5200,
    );
    return () => window.clearInterval(id);
  }, [paused]);

  const pick = useCallback((index: number) => {
    setSlide(index);
    setPaused(true);
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart.current === null) return;
      const delta = e.changedTouches[0].clientX - touchStart.current;
      if (Math.abs(delta) > 45) {
        setPaused(true);
        setSlide((n) => (n + (delta < 0 ? 1 : GALLERY.length - 1)) % GALLERY.length);
      }
      touchStart.current = null;
    },
    [],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);

    // Into the tracker as well, so the lead lands on the interested list rather
    // than only in an inbox. Fired first and deliberately not awaited: Web3Forms
    // is what decides whether this person sees a thank-you, and our own endpoint
    // must never be able to hold that up or turn into an error in front of them.
    void fetch("/api/ads/lead", { method: "POST", body: formData }).catch(() => {});

    formData.append("access_key", "f9fd4eed-280e-4c3e-bf11-579f9ff00522");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setIsSubmitted(true);
        if (typeof window !== "undefined") {
          const w = window as unknown as { fbq?: (...args: unknown[]) => void };
          w.fbq?.("track", "Lead");
        }
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } catch {
      setErrorMessage("Failed to submit. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slotsLine =
    slotsLeft === null
      ? "Ask us how many slots are open right now."
      : slotsLeft === 0
        ? "Every slot is taken right now. Ask to go on the waiting list."
        : `${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} left in the rotation.`;

  const current = GALLERY[slide];

  /**
   * The board, as slots rather than named categories. Naming them would tell
   * every visitor which trades we have failed to sell, which is a different
   * message from the one this section is for.
   */
  const taken = slotsLeft === null ? 0 : Math.max(0, totalSlots - slotsLeft);
  const slots = Array.from({ length: totalSlots }, (_, i) => ({
    n: i + 1,
    taken: i < taken,
  }));

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#1a1210]">
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {/* ------------------------------- header ------------------------------ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf6f0]/90 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image
              src="/assets/mex-taco-logo.png"
              alt="Mex Taco House"
              width={140}
              height={50}
              className="h-7 sm:h-8 w-auto"
              priority
            />
            <span className="hidden sm:block w-px h-6 bg-black/10" />
            <Image
              src="/assets/smart-scale-logo-official.png"
              alt="Smart Scale"
              width={120}
              height={120}
              className="hidden sm:block h-8 w-auto"
            />
          </div>
          <a
            href={phoneHref}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-[#1a1210] text-white text-sm font-semibold hover:bg-[#DC2626] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
              <path d="M3 5a2 2 0 012-2h2.6a1 1 0 01.98.79l1 4a1 1 0 01-.29.95l-1.5 1.5a12 12 0 005.66 5.66l1.5-1.5a1 1 0 01.95-.29l4 1a1 1 0 01.79.98V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">{phoneDisplay}</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </header>

      {/* -------------------------------- hero ------------------------------- */}
      <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-[#0f0a08] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/screens-wall.jpg"
            alt="Screens above the dining room at Mex Taco House with a client advertisement playing"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 34%" }}
          />
          <Image
            src="/images/dining-room.jpg"
            alt="The dining room at Mex Taco House at capacity"
            fill
            sizes="100vw"
            className="object-cover hero-crossfade"
            style={{ objectPosition: "center 60%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-[#0c0806]/95 via-[#0c0806]/85 to-[#0c0806]/50" />
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1fr_448px] gap-10 lg:gap-14 items-center">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-4 bg-[#faf6f0] rounded-full pl-4 pr-5 py-2 self-start shadow-xl shadow-black/40">
              <Image
                src="/assets/mex-taco-logo.png"
                alt="Mex Taco House"
                width={140}
                height={50}
                className="h-6 sm:h-7 w-auto"
              />
              <span className="w-px h-5 sm:h-6 bg-black/15" />
              <Image
                src="/assets/smart-scale-logo-official.png"
                alt="Smart Scale"
                width={120}
                height={120}
                className="h-7 sm:h-8 w-auto"
              />
            </div>

            <p
              className="text-2xl sm:text-3xl text-[#f0c674] leading-none mt-2 -mb-1"
              style={{ fontFamily: "var(--font-shadows), cursive" }}
            >
              Your business, right here
            </p>

            <h1
              className="text-white text-[3.4rem] sm:text-7xl lg:text-[7.4rem] leading-[0.84]"
              style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
            >
              Your ad.
              <br />
              This room.
              <br />
              Every day.
            </h1>

            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-lg mt-3">
              10,000+ impressions a month on the screens at Mex Taco House in
              Cypress. One business per category, and we design the ad for you.
            </p>

            <a
              href={phoneHref}
              className="inline-flex items-center gap-2 text-white font-semibold mt-2 self-start hover:text-[#f0c674] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#f0c674" className="w-[18px] h-[18px]">
                <path d="M3 5a2 2 0 012-2h2.6a1 1 0 01.98.79l1 4a1 1 0 01-.29.95l-1.5 1.5a12 12 0 005.66 5.66l1.5-1.5a1 1 0 01.95-.29l4 1a1 1 0 01.79.98V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Or just call, {phoneDisplay}
            </a>
          </div>

          {/* the form, in the fold */}
          <div id="quote" className="scroll-mt-24">
            {isSubmitted ? (
              <SuccessCard phoneDisplay={phoneDisplay} phoneHref={phoneHref} />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/50 border-t-[5px] border-[#DC2626] flex flex-col gap-4"
              >
                <input type="hidden" name="subject" value="Advertising enquiry, Mex Taco House" />
                <input type="hidden" name="src" value={source} />
                {/* Spam trap. Off-screen rather than display:none, because a
                    hidden field is the first thing a bot learns to skip. */}
                <div className="absolute left-[-9999px]" aria-hidden="true">
                  <label htmlFor="company_website">Do not fill this in</label>
                  <input id="company_website" type="text" name="company_website" tabIndex={-1} autoComplete="off" />
                </div>

                <div>
                  <p
                    className="text-[2.1rem] sm:text-[2.4rem] leading-none text-[#1a1210]"
                    style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
                  >
                    See if your category is open
                  </p>
                  <p className="text-sm text-[#7a6a5d] mt-1">
                    One business per category. We will tell you straight.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Your name" name="name" autoComplete="name" required />
                  <Field label="Business name" name="business_name" autoComplete="organization" required />
                  <Field label="Phone" name="phone" type="tel" autoComplete="tel" required />
                  <Field label="Email" name="email" type="email" autoComplete="email" required />
                </div>

                <Field
                  label="What do you sell?"
                  name="industry"
                  placeholder="Auto repair, insurance, real estate"
                  required
                />

                <div>
                  <label htmlFor="budget" className="block text-xs font-semibold text-[#5c4f45] mb-1.5">
                    Monthly budget
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    defaultValue=""
                    className="w-full px-4 h-12 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
                  >
                    <option value="">Not sure yet</option>
                    {BUDGETS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold text-[#5c4f45] mb-1.5">
                    Anything we should know? <span className="font-normal text-[#9a8b7d]">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition resize-none"
                  />
                </div>

                {errorMessage && (
                  <p className="text-sm text-[#DC2626] font-medium">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#DC2626] text-white text-2xl py-3.5 hover:bg-[#b91c1c] transition-colors disabled:opacity-60"
                  style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
                >
                  {isSubmitting ? "Sending" : "Check my category"}
                </button>
                <p className="text-xs text-[#9a8b7d] text-center">
                  Back within 24 hours. No spam, no obligation.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------ red band ----------------------------- */}
      <div className="bg-[#DC2626] py-4 sm:py-5 overflow-hidden whitespace-nowrap">
        <div className="inline-flex items-center gap-8 sm:gap-10 ticker-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="inline-flex items-center gap-8 sm:gap-10">
              {slotsLeft !== null && (
                <>
                  <span
                    className="text-2xl sm:text-3xl text-white"
                    style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
                  >
                    {slotsLeft} slots left in the rotation
                  </span>
                  <span className="text-white/50">&#9670;</span>
                </>
              )}
              {TICKER.map((item) => (
                <span key={item.text} className="inline-flex items-center gap-8 sm:gap-10">
                  <span
                    className={`text-2xl sm:text-3xl ${item.gold ? "text-[#f0c674]" : "text-white"}`}
                    style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
                  >
                    {item.text}
                  </span>
                  <span className="text-white/50">&#9670;</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------ the board ---------------------------- */}
      <section className="relative bg-[#1a1210] py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(56% 60% at 50% 0%, rgba(220,38,38,0.22), transparent 68%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto" data-animate="fade-up">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-7">
            <div>
              <p
                className="text-2xl sm:text-[1.7rem] text-[#f0c674] leading-none mb-1"
                style={{ fontFamily: "var(--font-shadows), cursive" }}
              >
                Only one of each, ever
              </p>
              <h2
                className="text-white text-5xl sm:text-6xl lg:text-7xl leading-[0.86]"
                style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
              >
                The board
              </h2>
            </div>
            {slotsLeft !== null && (
              <div className="flex items-center gap-3 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse" />
                <span
                  className="text-3xl sm:text-4xl text-[#f0c674]"
                  style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
                >
                  {slotsLeft} left
                </span>
              </div>
            )}
          </div>

          <p className="text-white/60 leading-relaxed max-w-2xl mb-7">
            Every slot in the rotation, and how many are still going. One
            business per category, so when yours is taken no competitor of yours
            can buy their way onto the same screen for as long as you run.
          </p>

          <div
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3"
            data-animate="stagger"
          >
            {slots.map((slot) => (
              <div
                key={slot.n}
                className={
                  slot.taken
                    ? "rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-4 sm:p-5"
                    : "rounded-2xl border-[1.5px] border-[#f0c674]/55 bg-[#f0c674]/[0.07] px-3 py-4 sm:p-5"
                }
              >
                <p
                  className={`text-2xl sm:text-3xl leading-none ${
                    slot.taken
                      ? "text-white/30 line-through decoration-2"
                      : "text-white"
                  }`}
                  style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
                >
                  {String(slot.n).padStart(2, "0")}
                </p>
                <p
                  className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] mt-1.5 ${
                    slot.taken ? "text-white/30" : "text-[#f0c674]"
                  }`}
                >
                  {slot.taken ? "Taken" : "Open"}
                </p>
              </div>
            ))}
          </div>

          <a
            href="#quote"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#DC2626] text-white text-2xl px-8 py-3.5 hover:bg-[#b91c1c] transition-colors"
            style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
          >
            Claim a slot
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px]">
              <path d="M5 12h14m0 0l-6-6m6 6l-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          <p className="text-white/35 text-sm mt-6">{slotsLine}</p>
        </div>
      </section>

      {/* ------------------------------- gallery ----------------------------- */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto" data-animate="fade-up">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
            <div>
              <p
                className="text-2xl sm:text-[1.7rem] text-[#DC2626] leading-none mb-1"
                style={{ fontFamily: "var(--font-shadows), cursive" }}
              >
                Photographed this month
              </p>
              <h2
                className="text-5xl sm:text-6xl lg:text-7xl leading-[0.88]"
                style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
              >
                On screen right now
              </h2>
            </div>
            <div className="flex items-center gap-2.5 pb-3">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a6a5d]">
                Live
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_250px] gap-5 items-start">
            {/* the big screen */}
            <div className="bg-[#0b0b0d] rounded-2xl p-3 pb-6 shadow-2xl shadow-black/20">
              <div
                className="relative rounded-lg overflow-hidden bg-black aspect-[16/10]"
                onTouchStart={(e) => {
                  touchStart.current = e.touches[0].clientX;
                }}
                onTouchEnd={onTouchEnd}
              >
                {GALLERY.map((shot, i) => (
                  <Image
                    key={shot.src}
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className={`object-cover transition-opacity duration-700 ${
                      i === slide ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ objectPosition: shot.position }}
                  />
                ))}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#0a0705]/95 to-transparent">
                  <p
                    className="text-2xl sm:text-3xl text-white leading-none"
                    style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
                  >
                    {current.caption}
                  </p>
                  <p className="text-sm text-white/60 mt-1">{current.detail}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2.5 mt-3">
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Mex Taco House, Cypress TX
                </span>
              </div>
            </div>

            {/* the small screens, and the one still empty */}
            <div className="grid grid-cols-4 lg:grid-cols-1 gap-3">
              {GALLERY.map((shot, i) => (
                <button
                  key={shot.src}
                  type="button"
                  onClick={() => pick(i)}
                  aria-label={`Show ${shot.caption}`}
                  className={`bg-[#0b0b0d] rounded-xl p-2 transition-opacity ${
                    i === slide ? "ring-2 ring-[#DC2626] opacity-100" : "opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="relative rounded overflow-hidden aspect-[16/10]">
                    <Image
                      src={shot.src}
                      alt=""
                      fill
                      sizes="140px"
                      className="object-cover"
                      style={{ objectPosition: shot.position }}
                    />
                  </div>
                </button>
              ))}
              <a
                href="#quote"
                className="bg-[#0b0b0d] rounded-xl p-2 col-span-4 lg:col-span-1"
              >
                <div className="rounded border-2 border-dashed border-[#f0c674]/50 aspect-[16/10] flex flex-col items-center justify-center">
                  <span
                    className="text-lg sm:text-xl text-[#f0c674] leading-none text-center"
                    style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
                  >
                    Your ad here
                  </span>
                  <span className="text-[10px] text-white/45 mt-0.5">the empty slot</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- stats ------------------------------ */}
      <section className="bg-[#f2e8d9] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8" data-animate="stagger">
          <Stat value={slotsLeft === null ? "16" : String(slotsLeft)} label="slots left" note="one business each" />
          <Stat value="4,200" label="plays a month" note="counted, not estimated" />
          <Stat value="3 min" label="between plays" note="every day we open" />
          <Stat value="10,000+" label="impressions a month" note="and they all look up" />
        </div>
      </section>

      {/* ---------------------------- how it works --------------------------- */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto" data-animate="fade-up">
          <p
            className="text-2xl sm:text-[1.7rem] text-[#DC2626] leading-none"
            style={{ fontFamily: "var(--font-shadows), cursive" }}
          >
            Straightforward
          </p>
          <h2
            className="text-5xl sm:text-6xl lg:text-7xl leading-[0.9] mb-9"
            style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
          >
            Three steps to on screen
          </h2>

          <div className="grid md:grid-cols-3 gap-5" data-animate="stagger">
            <Step n="01" title="Tell us about your business">
              Sixty seconds, six fields. That is the whole ask.
            </Step>
            <Step n="02" title="We design your ad" highlight>
              In your hands within 24 hours, with revisions until it is right.
              The design is covered by your one-time setup fee.
            </Step>
            <Step n="03" title="Approve, and you are live">
              On the screens the next business day.
            </Step>
          </div>
        </div>
      </section>

      {/* ---------------------------- price anchor --------------------------- */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto border-y-2 border-black/10 py-9 text-center">
          <p
            className="text-3xl sm:text-4xl lg:text-5xl leading-tight"
            style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
          >
            Plans start at <span className="text-[#DC2626]">{startingPrice}</span>, category exclusivity included
          </p>
          <p className="text-[#9a8b7d] mt-3">Full rate card on your call.</p>
        </div>
      </section>

      {/* --------------------------- website bundle -------------------------- */}
      <section className="bg-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-center" data-animate="fade-up">
          <div className="rounded-3xl overflow-hidden border border-black/[0.08] shadow-xl shadow-black/10">
            <Image
              src="/images/website-bundle.jpg"
              alt="Smart Scale, custom websites for businesses"
              width={1200}
              height={1119}
              className="w-full h-auto"
              sizes="(max-width: 1024px) 100vw, 600px"
            />
          </div>
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-[#f0c674] text-[#1a1210] text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
              Advertising + Website Bundle
            </span>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl leading-[0.9]"
              style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
            >
              Where are you sending them?
            </h2>
            <p className="text-lg text-[#5c4f45] leading-relaxed">
              Your ad puts you in front of 10,000+ impressions a month. If the
              site they land on is not ready for that, the ad is doing half a job.
            </p>
            <p className="text-[#7a6a5d] leading-relaxed">
              The same team designing your spot builds your site. One point of
              contact, one brand, start to finish.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <a
                href="#quote"
                className="px-7 py-3 rounded-full bg-[#DC2626] text-white text-2xl hover:bg-[#b91c1c] transition-colors"
                style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
              >
                Ask about the bundle
              </a>
              <a
                href={phoneHref}
                className="px-6 py-3 rounded-full border border-black/15 text-[#1a1210] text-2xl hover:border-[#DC2626]/40 transition-colors"
                style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
              >
                {phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------- included with all ------------------------ */}
      <section className="bg-[#f2e8d9] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto" data-animate="fade-up">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl leading-[0.9] text-center mb-8"
            style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
          >
            Included with every plan
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-animate="stagger">
            {INCLUDED.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white/65 rounded-2xl p-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- faq ------------------------------- */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto" data-animate="fade-up">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl leading-[0.9] mb-8"
            style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
          >
            Straight answers
          </h2>
          <div className="grid md:grid-cols-2 gap-x-14 gap-y-7">
            {FAQ.map((item) => (
              <div key={item.q}>
                <p
                  className="text-2xl sm:text-[1.7rem] leading-tight mb-1.5"
                  style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
                >
                  {item.q}
                </p>
                <p className="text-[#7a6a5d] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ final cta ---------------------------- */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-20">
        <div
          className="relative max-w-7xl mx-auto overflow-hidden rounded-3xl bg-[#DC2626] p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8"
          data-animate="fade-up"
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "radial-gradient(60% 90% at 88% 50%, rgba(240,198,116,0.32), transparent 65%)",
            }}
          />
          <div className="relative">
            <p
              className="text-2xl sm:text-3xl text-[#f0c674] leading-none mb-1"
              style={{ fontFamily: "var(--font-shadows), cursive" }}
            >
              One business per category
            </p>
            <h2
              className="text-white text-4xl sm:text-5xl lg:text-[3.7rem] leading-[0.9]"
              style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
            >
              Your category is open
              <br />
              today. It might not be
              <br />
              here next month.
            </h2>
          </div>
          <div className="relative flex flex-col gap-3 flex-shrink-0">
            <a
              href="#quote"
              className="px-8 py-4 rounded-full bg-white text-[#DC2626] text-2xl text-center hover:bg-white/90 transition-colors"
              style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
            >
              Claim my category
            </a>
            <a
              href={phoneHref}
              className="px-7 py-3.5 rounded-full border border-white/55 text-white text-2xl text-center hover:bg-white/10 transition-colors"
              style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
            >
              {phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------- footer ----------------------------- */}
      <footer className="py-8 pb-28 lg:pb-8 px-4 sm:px-6 lg:px-8 bg-[#1a1210] text-center">
        <p className="text-white/50 text-sm">
          Screen advertising at Mex Taco House, Cypress TX. Managed by{" "}
          <Link
            href="https://smartscaleagent.com"
            className="text-white/70 hover:text-white transition-colors underline underline-offset-2"
          >
            Smart Scale
          </Link>
        </p>
      </footer>

      {/* Sticky bar. Most visitors arrive by scanning a code on a table, so the
          action follows them the whole way down rather than waiting at the end. */}
      {!isSubmitted && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/97 backdrop-blur border-t border-black/10 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
          <a
            href="#quote"
            className="flex-1 text-center rounded-full bg-[#DC2626] text-white text-2xl py-3"
            style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
          >
            Claim my slot
          </a>
          <a
            href={phoneHref}
            aria-label={`Call ${phoneDisplay}`}
            className="w-[52px] h-[52px] rounded-full border border-black/10 bg-[#faf6f0] flex items-center justify-center flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#1a1210" className="w-5 h-5">
              <path d="M3 5a2 2 0 012-2h2.6a1 1 0 01.98.79l1 4a1 1 0 01-.29.95l-1.5 1.5a12 12 0 005.66 5.66l1.5-1.5a1 1 0 01.95-.29l4 1a1 1 0 01.79.98V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      )}

      <style jsx global>{`
        @keyframes hero-crossfade {
          0%, 42% { opacity: 1; }
          50%, 92% { opacity: 0; }
          100% { opacity: 1; }
        }
        .hero-crossfade { animation: hero-crossfade 14s ease-in-out infinite; }

        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-track { animation: ticker-scroll 34s linear infinite; }

        @keyframes confetti-fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(0); }
          10% { opacity: 1; transform: translateY(20px) rotate(45deg) scale(1); }
          100% { opacity: 0; transform: translateY(500px) rotate(720deg) scale(0.5); }
        }
        @keyframes circle-draw { to { stroke-dashoffset: 0; } }
        @keyframes check-draw { to { stroke-dashoffset: 0; } }
        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-crossfade, .ticker-track { animation: none; }
          .hero-crossfade { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------- pieces --------------------------------- */

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-[#5c4f45] mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-4 h-12 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
      />
    </div>
  );
}

function Stat({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div>
      <p
        className="text-6xl sm:text-7xl text-[#DC2626] leading-[0.84]"
        style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
      >
        {value}
      </p>
      <p className="font-semibold mt-1">{label}</p>
      <p className="text-sm text-[#9a8b7d]">{note}</p>
    </div>
  );
}

function Step({
  n,
  title,
  highlight,
  children,
}: {
  n: string;
  title: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        highlight
          ? "relative overflow-hidden rounded-3xl bg-[#1a1210] p-8 shadow-xl shadow-black/20"
          : "rounded-3xl bg-white border border-black/[0.06] p-8 shadow-lg shadow-black/[0.04]"
      }
    >
      {highlight && (
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(70% 80% at 50% 0%, rgba(220,38,38,0.36), transparent 68%)",
          }}
        />
      )}
      <div className="relative">
        <p
          className={`text-6xl leading-[0.8] ${highlight ? "text-[#f0c674]/30" : "text-[#DC2626]/20"}`}
          style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
        >
          {n}
        </p>
        <p
          className={`text-2xl sm:text-3xl leading-tight mt-2 ${highlight ? "text-white" : "text-[#1a1210]"}`}
          style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
        >
          {title}
        </p>
        <p className={`leading-relaxed mt-2 ${highlight ? "text-white/75" : "text-[#7a6a5d]"}`}>
          {children}
        </p>
      </div>
    </div>
  );
}

function SuccessCard({
  phoneDisplay,
  phoneHref,
}: {
  phoneDisplay: string;
  phoneHref: string;
}) {
  return (
    <div className="relative p-8 sm:p-10 rounded-3xl bg-white border-t-[5px] border-[#DC2626] text-center overflow-hidden shadow-2xl shadow-black/50">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-5%",
            backgroundColor: [
              "#DC2626", "#F59E0B", "#10B981", "#3B82F6",
              "#8B5CF6", "#EC4899", "#F97316", "#f0c674",
            ][i % 8],
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            borderRadius: i % 3 === 0 ? "50%" : "2px",
            animation: `confetti-fall ${2 + Math.random() * 3}s ease-in forwards`,
            animationDelay: `${Math.random() * 1.5}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            opacity: 0,
          }}
        />
      ))}

      <div className="relative w-20 h-20 mx-auto mb-5">
        <svg className="w-20 h-20" viewBox="0 0 80 80">
          <circle
            cx="40" cy="40" r="36" fill="none" stroke="#DC2626" strokeWidth="3"
            strokeDasharray="226" strokeDashoffset="226"
            className="animate-[circle-draw_0.6s_ease-out_0.3s_forwards]"
          />
          <path
            d="M24 42 L34 52 L56 30" fill="none" stroke="#DC2626" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="50" strokeDashoffset="50"
            className="animate-[check-draw_0.4s_ease-out_0.8s_forwards]"
          />
        </svg>
      </div>

      <h3
        className="text-4xl sm:text-5xl text-[#1a1210] mb-3 animate-[fade-slide-up_0.5s_ease-out_1s_both]"
        style={{ fontFamily: "var(--font-bebas), Impact, sans-serif" }}
      >
        Done
      </h3>
      <p className="text-[#5c4f45] mb-2 animate-[fade-slide-up_0.5s_ease-out_1.2s_both]">
        We will come back to you within 24 hours.
      </p>
      <p className="text-sm text-[#9a8b7d] mb-6 animate-[fade-slide-up_0.5s_ease-out_1.4s_both]">
        We will call or email with whether your category is open and what the
        spot would cost.
      </p>
      <a
        href={phoneHref}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1a1210] text-white font-semibold hover:bg-[#DC2626] transition-colors animate-[fade-slide-up_0.5s_ease-out_1.6s_both]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
          <path d="M3 5a2 2 0 012-2h2.6a1 1 0 01.98.79l1 4a1 1 0 01-.29.95l-1.5 1.5a12 12 0 005.66 5.66l1.5-1.5a1 1 0 01.95-.29l4 1a1 1 0 01.79.98V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Or call now, {phoneDisplay}
      </a>
    </div>
  );
}
