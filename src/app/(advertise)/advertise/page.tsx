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
import {
  atVenue,
  listAdvertisers,
  listPlanOf,
  planTermValue,
  summarize,
  DEFAULT_VENUE_ID,
  PUBLIC_PLANS,
} from "@/lib/ads/roster";
import { isRedisReachable } from "@/lib/ads/redis";
import { listVenues, liveVenues, venueOf } from "@/lib/ads/venues";
import AdvertisePage, { type PublicPlan } from "./_components/advertise-page";

/* --------------------------------- config --------------------------------- */
/* The bits you are most likely to want to change. */

const PHONE_DISPLAY = "832.407.0773";
const PHONE_HREF = "tel:+18324070773";

/**
 * The prices come from the same table the tracker bills against, so the page
 * cannot quote a rate the agreement then contradicts. Flattened to plain
 * numbers here because the client half must not import the roster.
 */
const PLANS_SHOWN: PublicPlan[] = PUBLIC_PLANS.map((plan) => {
  const list = listPlanOf(plan);
  return {
    id: plan.id,
    name: plan.name,
    months: plan.months,
    monthly: plan.monthly,
    setup: plan.setup,
    oneTime: Boolean(plan.oneTime),
    termValue: planTermValue(plan),
    listMonthly: list.monthly,
    listTermValue: planTermValue(list),
  };
});

/* -------------------------------- metadata -------------------------------- */

export const metadata: Metadata = {
  alternates: { canonical: "/advertise" },
  title: "Advertise at Mex Taco House | In-Restaurant TV Advertising",
  description:
    "Own your category on Mex Taco House's dining-room screens in Cypress, TX. 10,000+ impressions a month, one business per category, and we design your ad for you. Promo plans from $275 a month, or $3,000 for the year. Managed by Smart Scale.",
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
  const [advertisers, reachable, venues] = await Promise.all([
    listAdvertisers(),
    isRedisReachable(),
    listVenues(),
  ]);

  // The page is still Mex Taco House's, so its slot count is Mex Taco's. An
  // unreachable database returns an empty roster, which would otherwise read
  // as "every slot is free". Say nothing rather than say something false.
  const house = venueOf(venues, DEFAULT_VENUE_ID);
  const summary = reachable ? summarize(atVenue(advertisers, house.id), house.sellable) : null;
  // The form only asks which location once there is a second live one.
  const live = liveVenues(venues);
  const locations = live.length > 1 ? live.map((v) => ({ id: v.id, name: v.name, place: v.place })) : [];

  return (
    <AdvertisePage
      phoneDisplay={PHONE_DISPLAY}
      phoneHref={PHONE_HREF}
      plans={PLANS_SHOWN}
      totalSlots={house.sellable}
      slotsLeft={summary ? summary.openSlots : null}
      metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
      locations={locations}
    />
  );
}
