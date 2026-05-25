"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Play/pause the navbar video based on scroll state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (scrolled) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [scrolled]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/[0.08]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===== UNSCROLLED STATE: logo left, links right ===== */}
        <div
          className={`items-center justify-between h-24 transition-all duration-500 hidden md:flex ${
            scrolled
              ? "opacity-0 pointer-events-none absolute inset-x-0 px-4 sm:px-6 lg:px-8"
              : "opacity-100"
          }`}
        >
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/smart-scale-logo-official.png"
              alt="Smart Scale"
              width={240}
              height={96}
              className="h-20 w-auto brightness-0 invert"
              priority
              unoptimized
            />
          </Link>

          <div className="flex items-center gap-12">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="px-6 py-2.5 border border-white/20 text-white/80 rounded-full text-xs uppercase tracking-widest hover:border-white/40 hover:text-white transition-all duration-300"
            >
              Get in Touch
            </Link>
          </div>
        </div>

        {/* ===== SCROLLED STATE: links left | video center | links right ===== */}
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
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Center video logo */}
          <Link
            href="/"
            className="relative flex items-center justify-center mx-6"
          >
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                loop
                className="w-full h-full object-cover"
                style={{ mixBlendMode: "lighten" }}
              >
                <source src="/assets/use-this-logo.mp4" type="video/mp4" />
              </video>
            </div>
          </Link>

          {/* Right links + CTA */}
          <div className="flex items-center gap-8 flex-1 justify-end">
            {rightLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="px-6 py-2.5 border border-white/20 text-white/80 rounded-full text-xs uppercase tracking-widest hover:border-white/40 hover:text-white transition-all duration-300"
            >
              Get in Touch
            </Link>
          </div>
        </div>

        {/* ===== MOBILE: always same layout ===== */}
        <div className="flex md:hidden items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/smart-scale-logo-official.png"
              alt="Smart Scale"
              width={200}
              height={80}
              className="h-16 w-auto brightness-0 invert"
              priority
              unoptimized
            />
          </Link>

          <button
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-white"
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
          <div className="md:hidden pb-6 space-y-4 bg-black/95 backdrop-blur-xl -mx-4 px-4 border-t border-white/[0.08]">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-xs uppercase tracking-widest text-white/60 hover:text-white transition pt-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="block w-full px-6 py-2.5 border border-white/20 text-white/80 rounded-full text-xs uppercase tracking-widest text-center hover:border-white/40 hover:text-white transition-all duration-300"
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
