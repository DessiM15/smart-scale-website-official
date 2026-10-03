import type { Metadata } from "next";
import Link from "next/link";
import { verifyFixToken } from "@/lib/wb/links";
import { siteName } from "@/lib/wb/report";
import { getLead } from "@/lib/wb/store";
import { fixFromEmailAction } from "../../actions";
import { FixButton } from "../../_components/fix-button";
import { buttonPrimary, eyebrow, lede } from "../../_components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fix My Website",
  robots: { index: false, follow: false },
};

/**
 * Where "Fix my website for me" in an email lands. Opening this page records
 * nothing; the request is made when the button is pressed. Mail scanners
 * open links on their own, and a link by itself must never create a lead.
 */
export default async function FixPage({ params, searchParams }: { params: Promise<{ leadId: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ leadId }, { t = "" }] = await Promise.all([params, searchParams]);
  const lead = verifyFixToken(leadId, t) ? await getLead(leadId) : null;

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className={eyebrow}>Fix my website</p>
        {lead ? (
          <>
            <h1 className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08]">
              Want us to fix {lead.website ? siteName({ base: lead.website }) : "your site"}?
            </h1>
            <p className={`mt-6 ${lede}`}>
              Press the button and we will call you within one business day. The call is free, and you decide what happens after it.
            </p>
            <form action={fixFromEmailAction} className="mt-10">
              <input type="hidden" name="leadId" value={leadId} />
              <input type="hidden" name="t" value={t} />
              <FixButton from="email" />
            </form>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08]">This link has stopped working.</h1>
            <p className={`mt-6 ${lede}`}>Run the check again and the new report will have a working button. It takes about a minute.</p>
            <div className="mt-10">
              <Link href="/check" className={buttonPrimary}>
                Check my website again
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
