import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/assets/smart-scale-logo-official.png"
                alt="Smart Scale"
                width={180}
                height={72}
                className="h-12 w-auto brightness-0 invert"
                unoptimized
              />
            </Link>
            <p className="text-sm text-white/40 max-w-md">
              Enterprise software, AI systems, and digital transformation
              solutions for businesses requiring precision and performance.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">
              Navigation
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-sm text-white/40 hover:text-[#DC2626] transition"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/what-we-do"
                  className="text-sm text-white/40 hover:text-[#DC2626] transition"
                >
                  What We Do
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-sm text-white/40 hover:text-[#DC2626] transition"
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  href="/company"
                  className="text-sm text-white/40 hover:text-[#DC2626] transition"
                >
                  Company
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-white/40 hover:text-[#DC2626] transition"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/40 hover:text-[#DC2626] transition"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/40 hover:text-[#DC2626] transition"
                >
                  Request Estimate
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/[0.08]">
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} Smart Scale. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
