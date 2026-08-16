/**
 * Google Business Profile reviews, transcribed for display on the site.
 *
 * IMPORTANT — these are deliberately NOT emitted as Review or
 * AggregateRating JSON-LD anywhere. Google's structured data guidelines
 * prohibit "self-serving" review markup: reviews about your own business,
 * published on your own site. Marking these up would get the rich result
 * stripped and risks a manual action. The stars that appear in search come
 * from the Google Business Profile itself.
 *
 * This section is therefore a conversion asset, not an SEO asset — which is
 * still worth a lot, since social proof above the fold is one of the
 * strongest levers on contact-form completion.
 *
 * To add a review: copy it verbatim from the Google Business Profile. Do not
 * paraphrase or shorten — displaying an edited version of someone's review
 * under their name misrepresents them.
 */

export interface Review {
  /** Reviewer name exactly as shown on Google. */
  author: string;
  /** 1–5. */
  rating: number;
  /** Full review text, verbatim. */
  text: string;
  /** ISO date (YYYY-MM-DD) or a relative label like "3 months ago". */
  date?: string;
  /** Optional: the business/context, e.g. "Gin & Jack". */
  context?: string;
}

export const REVIEWS: Review[] = [
  {
    author: "Kira Rai Daniel",
    rating: 5,
    date: "2026-08-12",
    context: "New York",
    text:
      "If you're not hiring smart scale as your website developer then you " +
      "must not want a good website. I've worked with developers before on " +
      "various projects and hands down this is the best one yet. Their " +
      "ability to capture your brand, voice, and personality from a single " +
      "call and mockup a website is just phenomenal. I now recommend them to " +
      "anyone looking for a website!",
  },
  {
    author: "Emily Stanley",
    rating: 5,
    date: "2026-08-12",
    context: "Gin & Jack \u2014 Cypress, TX",
    text:
      "Amazing services!! They operate very efficiently and communicate so " +
      "well! A very smooth experience, I would definitely recommend!",
  },
];

/** True once at least one review has been transcribed. */
export const HAS_REVIEWS = REVIEWS.length > 0;
