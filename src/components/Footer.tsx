import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white" data-theme="dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/assets/smart-scale-logo-official.png"
                alt="Smart Scale"
                width={320}
                height={128}
                className="h-20 w-auto brightness-0 invert"
                unoptimized
              />
            </Link>
            <p className="text-sm text-white/40 max-w-md">
              Precision-engineered enterprise software, AI systems, and digital
              platforms. Architected for growth, built without compromise.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-medium mb-4 text-white/60">
              Navigation
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/what-we-do", label: "Services" },
                { href: "/portfolio", label: "Work" },
                { href: "/company", label: "About" },
                { href: "/blog", label: "Journal" },
              ].map((link) => (
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
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/40 hover:text-white transition-colors duration-300"
                >
                  Start a Conversation
                </Link>
              </li>
              <li>
                <a
                  href="mailto:project@ssl-mail.com"
                  className="text-sm text-white/40 hover:text-white transition-colors duration-300"
                >
                  project@ssl-mail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-white/25 tracking-wide">
            &copy; {new Date().getFullYear()} Smart Scale. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
