import Link from "next/link";
import Image from "next/image";
import { BUSINESS, SERVICE_AREAS, SOCIALS } from "@/lib/business";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white" data-theme="dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/assets/smart-scale-logo-official.png"
                alt="Smart Scale web design agency logo"
                width={320}
                height={128}
                className="h-20 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-sm text-white/40 max-w-md">
              Websites, local SEO, and custom software for businesses across
              the Houston metro. Serving Katy, Cypress, Houston, Sugar Land,
              Richmond, and Fulshear, TX.
            </p>

            {/*
              NAP block. Rendered as crawlable text (never an image) and driven
              from src/lib/business.ts so it stays byte-identical to the
              Google Business Profile — Google cross-references the two when
              deciding whether to trust the listing.
            */}
            <address className="mt-8 not-italic text-sm text-white/40 space-y-2">
              <p className="text-white/60 font-medium">{BUSINESS.legalName}</p>
              <p>
                <a
                  href={BUSINESS.phone.href}
                  className="hover:text-white transition-colors duration-300"
                >
                  {BUSINESS.phone.display}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="hover:text-white transition-colors duration-300"
                >
                  {BUSINESS.email}
                </a>
              </p>
              <p>
                {BUSINESS.locality}, {BUSINESS.region} &mdash; serving{" "}
                {SERVICE_AREAS.map((c) => c.name).join(", ")}
              </p>
            </address>

            <ul className="mt-6 flex items-center gap-5">
              {SOCIALS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/40 hover:text-white transition-colors duration-300"
                  >
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest font-medium mb-4 text-white/60">
              Navigation
            </h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest font-medium mb-4 text-white/60">
              Service Areas
            </h4>
            {/* Descriptive anchors into the city pages — these are the main
                internal links pointing at the local landing pages. */}
            <ul className="space-y-3">
              {SERVICE_AREAS.filter((c) => c.page).map((city) => (
                <li key={city.slug}>
                  <Link
                    href={`/web-design/${city.slug}`}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-300"
                  >
                    Website Design in {city.name}, TX
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/40 hover:text-white transition-colors duration-300"
                >
                  Start a Conversation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-white/25 tracking-wide">
            &copy; {new Date().getFullYear()} {BUSINESS.legalName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
