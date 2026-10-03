import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business";
import { leadFromUnsubToken } from "@/lib/wb/links";
import { unsubscribeAction } from "../actions";
import { buttonPrimary, eyebrow, lede, textLink } from "../_components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/** One button. Unsubscribing takes effect at once and is permanent. */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t = "", done } = await searchParams;
  const valid = leadFromUnsubToken(t) !== null;

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className={eyebrow}>Email preferences</p>
        {done && valid ? (
          <>
            <h1 className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08]">You are unsubscribed.</h1>
            <p className={`mt-6 ${lede}`}>We will not email you about your website check again. Your report link keeps working for its 90 days.</p>
          </>
        ) : valid ? (
          <>
            <h1 className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08]">Stop emails from Smart Scale?</h1>
            <p className={`mt-6 ${lede}`}>Press the button and we will not email you about your website check again.</p>
            <form action={unsubscribeAction} className="mt-10">
              <input type="hidden" name="t" value={t} />
              <button type="submit" className={buttonPrimary}>
                Unsubscribe me
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08]">We could not read that link.</h1>
            <p className={`mt-6 ${lede}`}>
              Email{" "}
              <a href={`mailto:${BUSINESS.email}?subject=Unsubscribe`} className={textLink}>
                {BUSINESS.email}
              </a>{" "}
              with the word unsubscribe and we will take you off the list by hand.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
