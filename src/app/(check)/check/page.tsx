import type { Metadata } from "next";
import Link from "next/link";
import WebsiteCheckForm from "@/components/check/WebsiteCheckForm";
import NoWebsiteForm from "@/components/check/NoWebsiteForm";
import { eyebrow, lede, panel, textLink } from "./_components/ui";

export const metadata: Metadata = {
  title: "Free Website Check",
  description:
    "See what is getting in your customers' way. A free check of your website's accessibility and Google basics, in about a minute, with the report sent to your inbox.",
  alternates: { canonical: "/check" },
};

/** Only the values a link is expected to carry; anything else is dropped. */
const cleanSource = (raw: string | undefined) => (raw ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);

const CHECKS = [
  ["On a phone and a computer", "Whether the page fits a small screen and the text can be read."],
  ["With a keyboard", "Whether someone who cannot use a mouse can reach your menu, your form and your buttons."],
  ["The Google basics", "Titles, descriptions and the signals Google uses to understand a local business."],
];

/**
 * The free website check. The scan form comes first; a visitor with no
 * website yet follows the link under it to the second form, on the same
 * address, so the page works the same with or without scripts.
 */
export default async function CheckPage({ searchParams }: { searchParams: Promise<{ source?: string; start?: string }> }) {
  const params = await searchParams;
  const source = cleanSource(params.source);
  const noWebsite = params.start === "new";
  const query = source ? `&source=${source}` : "";

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className={eyebrow}>{noWebsite ? "No website yet" : "Free website check"}</p>
          <h1 className="mt-4 text-[clamp(36px,5vw,60px)] leading-[1.05]">
            {noWebsite ? "Let's get your business online." : "See what is getting in your customers' way."}
          </h1>
          <p className={`mt-6 ${lede}`}>
            {noWebsite
              ? "Tell us how to reach you and what you need. One of us will call within one business day with a plan for your first website and your Google listing."
              : "Type in your website and we will check it the way a visitor and Google do. It takes about a minute, it is free, and the report comes to your inbox in plain words."}
          </p>
          {!noWebsite && (
            <>
              <h2 className="mt-12 text-2xl">What we check</h2>
              <ul className="mt-5 space-y-5">
                {CHECKS.map(([title, text]) => (
                  <li key={title}>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 leading-relaxed text-white/65">{text}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <div className={panel}>
            <h2 className="text-2xl">{noWebsite ? "Tell us about your business" : "Start your free check"}</h2>
            <div className="mt-6">{noWebsite ? <NoWebsiteForm source={source} /> : <WebsiteCheckForm source={source} />}</div>
          </div>
          <p className="mt-6 text-white/65">
            {noWebsite ? (
              <>
                Already have a website?{" "}
                <Link href={`/check${source ? `?source=${source}` : ""}`} className={textLink}>
                  Check it for free
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have a website yet?{" "}
                <Link href={`/check?start=new${query}`} className={textLink}>
                  Start here instead
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
