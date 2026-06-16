"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const leftLinks = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Work" },
];

const rightLinks = [
  { href: "/what-we-do", label: "Services" },
  { href: "/company", label: "About" },
  { href: "/contact", label: "Contact" },
];

const allLinks = [...leftLinks, ...rightLinks];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navTheme, setNavTheme] = useState<"light" | "dark">("light");

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Section-aware theme detection via ScrollTrigger
  useEffect(() => {
    const sections = document.querySelectorAll("[data-theme]");
    const triggers: ScrollTrigger[] = [];

    sections.forEach((section) => {
      const theme = section.getAttribute("data-theme") as "light" | "dark";

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onEnter: () => setNavTheme(theme),
        onEnterBack: () => setNavTheme(theme),
      });

      triggers.push(st);
    });

    return () => {
      triggers.forEach((st) => st.kill());
    };
  }, []);

  // Derived theme colors
  const isLight = navTheme === "light";
  const textColor = isLight ? "text-[#111111]/60" : "text-white/60";
  const textHover = isLight ? "hover:text-[#111111]" : "hover:text-white";
  const logoColor = isLight ? "black" : "white";
  const borderColor = isLight ? "border-black/20" : "border-white/20";
  const borderHover = isLight ? "hover:border-black/40" : "hover:border-white/40";
  const ctaText = isLight ? "text-[#111111]/80" : "text-white/80";
  const ctaTextHover = isLight ? "hover:text-[#111111]" : "hover:text-white";
  const scrolledBg = isLight ? "bg-white/80" : "bg-black/80";
  const scrolledBorder = isLight ? "border-black/[0.08]" : "border-white/[0.08]";
  const hamburgerColor = isLight ? "text-[#111111]" : "text-white";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? `${scrolledBg} backdrop-blur-xl border-b ${scrolledBorder}`
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===== UNSCROLLED STATE: no logo, links right ===== */}
        <div
          className={`items-center justify-end h-24 transition-all duration-500 hidden md:flex ${
            scrolled
              ? "opacity-0 pointer-events-none absolute inset-x-0 px-4 sm:px-6 lg:px-8"
              : "opacity-100"
          }`}
        >
          <div className="flex items-center gap-12">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-widest transition-colors duration-300 ${textColor} ${textHover}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className={`px-6 py-2.5 border rounded-full text-xs uppercase tracking-widest transition-all duration-300 ${borderColor} ${ctaText} ${borderHover} ${ctaTextHover}`}
            >
              Get in Touch
            </Link>
          </div>
        </div>

        {/* ===== SCROLLED STATE: links left | logo center | links right ===== */}
        <div
          className={`items-center justify-between h-20 transition-all duration-500 hidden md:flex ${
            scrolled
              ? "opacity-100"
              : "opacity-0 pointer-events-none absolute inset-x-0 px-4 sm:px-6 lg:px-8"
          }`}
        >
          {/* Left links */}
          <div className="flex items-center gap-8 flex-1">
            {leftLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-widest transition-colors duration-300 ${textColor} ${textHover}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Center logo (same as hero) */}
          <Link
            href="/"
            className="relative flex items-center justify-center mx-6"
          >
            <div
              className="h-12 w-auto transition-colors duration-300"
              style={{
                WebkitMaskImage: "url(/assets/smart-scale-logo-official.png)",
                maskImage: "url(/assets/smart-scale-logo-official.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                backgroundColor: logoColor,
                aspectRatio: "240 / 96",
              }}
              role="img"
              aria-label="Smart Scale"
            />
          </Link>

          {/* Right links + CTA */}
          <div className="flex items-center gap-8 flex-1 justify-end">
            {rightLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-widest transition-colors duration-300 ${textColor} ${textHover}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className={`px-6 py-2.5 border rounded-full text-xs uppercase tracking-widest transition-all duration-300 ${borderColor} ${ctaText} ${borderHover} ${ctaTextHover}`}
            >
              Get in Touch
            </Link>
          </div>
        </div>

        {/* ===== MOBILE: always same layout ===== */}
        <div className="flex md:hidden items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <div
              className="h-10 w-auto transition-colors duration-300"
              style={{
                WebkitMaskImage: "url(/assets/smart-scale-logo-official.png)",
                maskImage: "url(/assets/smart-scale-logo-official.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                backgroundColor: logoColor,
                aspectRatio: "200 / 80",
              }}
              role="img"
              aria-label="Smart Scale"
            />
          </Link>

          <button
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className={`w-6 h-6 transition-colors duration-300 ${hamburgerColor}`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden pb-6 space-y-4 backdrop-blur-xl -mx-4 px-4 border-t ${
              isLight
                ? "bg-white/95 border-black/[0.08]"
                : "bg-black/95 border-white/[0.08]"
            }`}
          >
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block text-xs uppercase tracking-widest transition pt-4 ${textColor} ${textHover}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className={`block w-full px-6 py-2.5 border rounded-full text-xs uppercase tracking-widest text-center transition-all duration-300 ${borderColor} ${ctaText} ${borderHover} ${ctaTextHover}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Get in Touch
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
