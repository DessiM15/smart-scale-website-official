import Image from "next/image";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { NOT_LEGAL_LINE } from "@/lib/wb/report";

/**
 * The frame for the free website check: the logo, the phone number, and
 * nothing else to tap. A visitor who arrives from a postcard or an email
 * came to do one thing, so the full navigation and footer stay out of it.
 */
export default function CheckLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0C0B0A] text-white" data-theme="dark">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-[#DC2626] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Image src="/assets/smart-scale-logo-light-red.png" alt="Smart Scale home" width={485} height={320} priority className="h-12 w-auto" />
          </Link>
          <a
            href={BUSINESS.phone.href}
            className="rounded text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span className="sr-only">Call Smart Scale at </span>
            {BUSINESS.phone.display}
          </a>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-white/65 sm:px-6 lg:px-8">
          <p>{NOT_LEGAL_LINE}</p>
          <p>
            Smart Scale, {BUSINESS.locality}, Texas.{" "}
            <Link href="/privacy" className="text-white underline underline-offset-4 hover:text-[#EF4444]">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
