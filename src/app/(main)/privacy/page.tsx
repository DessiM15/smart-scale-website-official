import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Smart Scale collects when you use this site or the free website check, why, how long it is kept, and how to unsubscribe or ask us to delete it.",
  alternates: { canonical: "/privacy" },
};

const link = "text-white underline underline-offset-4 hover:text-[#EF4444]";

/**
 * The privacy page. Written to be read: what is collected, why, how long it
 * is kept, and how to stop it. It describes what the site actually does, so
 * it has to change when the site does.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0C0B0A] text-white" data-theme="dark">
      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#EF4444]">Privacy</p>
          <h1 className="mt-4 text-[clamp(36px,5vw,64px)] leading-[1.05]">Privacy</h1>
          <p className="mt-6 text-lg leading-relaxed text-white/65">
            Smart Scale is a small web design business in Katy, Texas. This page says what we collect when you use this site, why we collect it,
            how long we keep it, and how to make us stop.
          </p>

          <h2 className="mt-14 text-2xl">What we collect</h2>
          <ul className="mt-4 space-y-3 leading-relaxed text-white/65">
            <li>
              <strong className="text-white">The free website check.</strong> The website address and the email address you type in, the results
              of the check, and the time you asked for it.
            </li>
            <li>
              <strong className="text-white">The &quot;no website yet&quot; form.</strong> Your name, phone number, email address, business name,
              what you told us you need, and the time of day you prefer to be reached.
            </li>
            <li>
              <strong className="text-white">The contact form and booking calendar.</strong> Whatever you type into them. The calendar is run by
              Google and is covered by Google&apos;s own privacy policy.
            </li>
            <li>
              <strong className="text-white">Visits.</strong> We use Google Analytics to count visits and see which pages are read. It sets cookies
              and records general information such as your city and the kind of device you use.
            </li>
            <li>
              <strong className="text-white">Abuse protection.</strong> Forms are protected against automated abuse, which involves your IP address
              being checked briefly and not kept with your details.
            </li>
          </ul>

          <h2 className="mt-14 text-2xl">Why we collect it</h2>
          <p className="mt-4 leading-relaxed text-white/65">
            To run the check you asked for, send you its report, follow up about it a couple of times, and call or write back when you ask us
            to. Your phone number is used only to call you back. We do not send marketing texts, and we do not sell or rent your information
            to anyone.
          </p>

          <h2 className="mt-14 text-2xl">Who else handles it</h2>
          <p className="mt-4 leading-relaxed text-white/65">
            We use a small number of service providers to run this site: hosting, a database, an email delivery service, Google Analytics,
            Google Calendar, and a bot check. They process information on our behalf to provide those services and for no other purpose of
            ours.
          </p>

          <h2 className="mt-14 text-2xl">How long we keep it</h2>
          <ul className="mt-4 space-y-3 leading-relaxed text-white/65">
            <li>Website check reports are kept for 90 days, then deleted. The report link stops working at that point.</li>
            <li>Your contact details and the history of our conversation are kept while we are in touch and for as long as we need them for our records.</li>
            <li>If you unsubscribe, we keep your email address on a do-not-email list so that we do not write to you again by mistake.</li>
          </ul>

          <h2 className="mt-14 text-2xl">Unsubscribing and deleting</h2>
          <p className="mt-4 leading-relaxed text-white/65">
            Every email we send about a website check has an unsubscribe link, and unsubscribing takes effect immediately. To see what we hold
            about you, correct it, or have it deleted, email{" "}
            <a href={`mailto:${BUSINESS.email}`} className={link}>
              {BUSINESS.email}
            </a>{" "}
            or call{" "}
            <a href={BUSINESS.phone.href} className={link}>
              {BUSINESS.phone.display}
            </a>
            . We will reply within five business days.
          </p>

          <h2 className="mt-14 text-2xl">About the website check</h2>
          <p className="mt-4 leading-relaxed text-white/65">
            The check looks only at pages anyone can open in a browser. It does not sign in to anything and does not change your site. Its
            report is not a legal certification and is not legal advice.
          </p>

          <p className="mt-14 border-t border-white/[0.09] pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">
            Last updated October 3, 2026
          </p>
          <p className="mt-6 text-sm text-white/65">
            <Link href="/check" className={link}>
              Run a free website check
            </Link>{" "}
            or{" "}
            <Link href="/contact" className={link}>
              contact us
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
