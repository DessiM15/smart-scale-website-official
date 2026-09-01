/**
 * /advertise
 *
 * A server component so the page can read the roster. How many slots are left
 * comes from the tracker rather than from a number typed into the file: a page
 * that says a slot is free after it has been sold is worse than one that says
 * nothing, and a hand-edited count is wrong the day after somebody signs.
 *
 * Everything visual lives in ./_components/advertise-page.
 */

import type { Metadata } from "next";
import { listAdvertisers, summarize, SELLABLE_SLOTS } from "@/lib/ads/roster";
import { isRedisReachable } from "@/lib/ads/redis";
import AdvertisePage from "./_components/advertise-page";

/* --------------------------------- config --------------------------------- */
/* The bits you are most likely to want to change. */

const PHONE_DISPLAY = "832.407.0773";
const PHONE_HREF = "tel:+18324070773";

/** Shown as the anchor. The full rate card stays off the page, on the call. */
const STARTING_PRICE = "$300 a month";

/* -------------------------------- metadata -------------------------------- */

export const metadata: Metadata = {
  title: "Advertise at Mex Taco House | In-Restaurant TV Advertising",
  description:
    "Own your category on Mex Taco House's dining-room screens in Cypress, TX. 10,000+ impressions a month, one business per category, and we design your ad for you. Plans from $300/mo. Managed by Smart Scale.",
  openGraph: {
    title: "Advertise at Mex Taco House | In-Restaurant TV Advertising",
    description:
      "Own your category on Mex Taco House's dining-room screens. 10,000+ impressions a month, one business per category. We design your ad, track the scans, and report the results.",
    type: "website",
  },
};

/**
 * Re-read every five minutes. The board should track reality without making a
 * database call part of every visitor's page load.
 */
export const revalidate = 300;

export default async function Page() {
  const [advertisers, reachable] = await Promise.all([
    listAdvertisers(),
    isRedisReachable(),
  ]);

  // An unreachable database returns an empty roster, which would otherwise read
  // as "every slot is free". Say nothing rather than say something false.
  const summary = reachable ? summarize(advertisers) : null;

  return (
    <AdvertisePage
      phoneDisplay={PHONE_DISPLAY}
      phoneHref={PHONE_HREF}
      startingPrice={STARTING_PRICE}
      totalSlots={SELLABLE_SLOTS}
      slotsLeft={summary ? summary.openSlots : null}
      metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
    />
  );
}
