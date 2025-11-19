"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/smart-scale-logo-official.png"
              alt="Smart Scale"
              width={150}
              height={60}
              className="h-12 w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-black hover:text-[#DC2626] transition"
            >
              Home
            </Link>
            <Link
              href="/what-we-do"
              className="text-sm font-medium text-black hover:text-[#DC2626] transition"
            >
              What We Do
            </Link>
            <Link
              href="/portfolio"
              className="text-sm font-medium text-black hover:text-[#DC2626] transition"
            >
              Portfolio
            </Link>
            <Link
              href="/company"
              className="text-sm font-medium text-black hover:text-[#DC2626] transition"
            >
              Company
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-black hover:text-[#DC2626] transition"
            >
              Contact
            </Link>
            <Link
              href="/contact"
              className="px-6 py-2.5 bg-[#DC2626] text-white rounded-full text-sm font-semibold hover:bg-red-700 transition"
            >
              Request Estimate
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-black"
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
          <div className="md:hidden pb-6 space-y-4">
            <Link
              href="/"
              className="block text-sm font-medium text-black hover:text-[#DC2626] transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/what-we-do"
              className="block text-sm font-medium text-black hover:text-[#DC2626] transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              What We Do
            </Link>
            <Link
              href="/portfolio"
              className="block text-sm font-medium text-black hover:text-[#DC2626] transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portfolio
            </Link>
            <Link
              href="/company"
              className="block text-sm font-medium text-black hover:text-[#DC2626] transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Company
            </Link>
            <Link
              href="/contact"
              className="block text-sm font-medium text-black hover:text-[#DC2626] transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/contact"
              className="block w-full px-6 py-2.5 bg-[#DC2626] text-white rounded-full text-sm font-semibold text-center hover:bg-red-700 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Request Estimate
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

