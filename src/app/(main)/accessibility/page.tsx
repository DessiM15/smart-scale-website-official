import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "Smart Scale's commitment to an accessible website: the WCAG 2.2 AA standard we build to, what we have done, known limitations, and how to report a problem.",
  alternates: { canonical: "/accessibility" },
};

/**
 * The accessibility statement. Plain, honest, and dated. It is not a legal
 * guarantee and does not read like one: it says what standard the site is
 * built to, what that meant in practice, what we know is still imperfect,
 * and how to reach a person when something does not work.
 */
export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[#0C0B0A] text-white" data-theme="dark">
      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#EF4444]">Accessibility</p>
          <h1 className="mt-4 text-[clamp(36px,5vw,64px)] leading-[1.05]">Accessibility statement</h1>
          <p className="mt-6 text-lg leading-relaxed text-white/65">
            Smart Scale wants every visitor to be able to read this site, move through it, and reach us, whatever
            device or assistive technology they use. This page says what we build to, what we have done, and how to
            tell us when something does not work.
          </p>

          <h2 className="mt-14 text-2xl">The standard we build to</h2>
          <p className="mt-4 leading-relaxed text-white/65">
            This site is built to meet the Web Content Accessibility Guidelines (WCAG) version 2.2 at Level AA. That is
            the level courts and the U.S. Department of Justice point to when they decide whether a website is
            accessible, and it is the standard we build our clients&apos; sites to as well.
          </p>

          <h2 className="mt-14 text-2xl">What that means here</h2>
          <ul className="mt-4 space-y-3 leading-relaxed text-white/65">
            <li>Text and its background meet the 4.5 to 1 contrast minimum, including small labels and footer text.</li>
            <li>Every page can be used with a keyboard alone, with a visible focus indicator and a skip link to the main content.</li>
            <li>Images carry written descriptions, and purely decorative graphics are hidden from screen readers.</li>
            <li>Forms have visible labels tied to their fields.</li>
            <li>Animation, smooth scrolling, and moving content switch off when your device asks for reduced motion.</li>
            <li>Links that open a new tab say so.</li>
            <li>We check the site with automated accessibility tests and by hand with a keyboard and a screen reader.</li>
          </ul>

          <h2 className="mt-14 text-2xl">Known limitations</h2>
          <p className="mt-4 leading-relaxed text-white/65">
            The booking calendar on the contact page is provided by Google and we cannot change how it behaves. If it
            is hard to use, call or email us and we will book the time for you. The live previews of client websites on
            our portfolio pages are those clients&apos; own sites, and each one is described in text above its preview.
          </p>

          <h2 className="mt-14 text-2xl">Tell us if something is in your way</h2>
          <p className="mt-4 leading-relaxed text-white/65">
            If any part of this site is hard to use, we want to know. Email{" "}
            <a href={`mailto:${BUSINESS.email}`} className="text-white underline underline-offset-4 hover:text-[#EF4444]">
              {BUSINESS.email}
            </a>{" "}
            or call{" "}
            <a href={BUSINESS.phone.href} className="text-white underline underline-offset-4 hover:text-[#EF4444]">
              {BUSINESS.phone.display}
            </a>
            . Tell us the page and what happened, and we will reply within five business days and fix what we can.
          </p>

          <p className="mt-14 border-t border-white/[0.09] pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">
            Statement last reviewed September 27, 2026
          </p>
          <p className="mt-6 text-sm text-white/65">
            <Link href="/contact" className="text-white underline underline-offset-4 hover:text-[#EF4444]">
              Contact us
            </Link>{" "}
            about accessibility on your own business website.
          </p>
        </div>
      </section>
    </div>
  );
}
