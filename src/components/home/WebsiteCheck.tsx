import Link from "next/link";
import WebsiteCheckForm from "@/components/check/WebsiteCheckForm";

/**
 * The free website check, offered on the homepage with the same two-box
 * form as /check. A lead that starts here is tagged `homepage`.
 */
export default function WebsiteCheck() {
  return (
    <section className="mt-20 border-y border-white/[0.16] bg-[#131211] px-4 sm:mt-28 sm:px-6 lg:px-8" data-theme="dark">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[7fr_5fr] lg:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">Free website check · About a minute</p>
            <h2 className="mt-4 text-[clamp(36px,4.6vw,64px)] leading-[1.05] text-white">
              See what is getting in your customers&apos; <em className="italic text-[#DC2626]">way.</em>
            </h2>
            <p className="mt-5 max-w-[32em] text-white/65">
              Type in your website and we check it the way a visitor and Google do: on a phone, with a keyboard, and for the basics Google looks for. The
              report comes to your inbox in plain words.
            </p>
            <p className="mt-6 text-white/65">
              Don&apos;t have a website yet?{" "}
              <Link href="/check?start=new&source=homepage" className="text-white underline underline-offset-4 transition-colors hover:text-[#EF4444]">
                Start here instead
              </Link>
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.09] bg-[#0C0B0A] p-6 sm:p-8">
            <WebsiteCheckForm source="homepage" id="home-check" />
          </div>
        </div>
      </div>
    </section>
  );
}
