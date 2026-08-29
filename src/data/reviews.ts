import { projects, type Project } from "@/data/projects";

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
 * under their name misrepresents them. The card shows a shortened preview,
 * but that is display truncation only: the full text is always one click
 * away in the modal, and `text` below must stay word-for-word.
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
  /** Optional: where they are, e.g. "Cypress, TX". */
  context?: string;
  /**
   * Portfolio slugs for the work this reviewer actually hired us for, in the
   * order they should appear. Rendered as links back to those case studies,
   * which is the whole point: social proof that leads somewhere. A slug with
   * no matching project is dropped at render rather than shown as a dead
   * link, so renaming a project can't strand a review.
   */
  projectSlugs?: string[];
}

export const REVIEWS: Review[] = [
  {
    author: "Sella Hall",
    rating: 5,
    date: "2026-08-26",
    projectSlugs: ["botmakers-website", "botmakers-crm"],
    text:
      "We reached out to Smart Scale, LLC to build our website. They were " +
      "extremely professional and fast!! They finished our website in less " +
      "than a week! Our website was more than what we expected and they " +
      "added things we didn’t think we needed! We will definitely go back " +
      "to them for all of our website design and more!",
  },
  {
    author: "Cheryl Baptiste",
    rating: 5,
    date: "2026-08-22",
    projectSlugs: ["fgt-solutions", "cheryl-baptiste"],
    text:
      "I had two websites done by Smart Scale. First, let me say they are " +
      "very professional and timely. From the initial conversation to " +
      "completion was 8 days! I'm not sure how they got into my head and " +
      "were able to bring to life what I wanted but couldn't articulate but " +
      "they did. I loved that it was a collaboration not a one way " +
      "conversation. They not only listened but made valuable suggestions " +
      "to get me to the end result which I LOVE. Any request were resolved " +
      "in less than 24 hrs. I cannot recommend them enough. I had spoken to " +
      "several other folks for this work and it was over priced and more " +
      "complicated than it needed to be. Working with Smart Scale was the " +
      "best decision I've made yet.",
  },
  {
    author: "Taylor Heathcoo",
    rating: 5,
    date: "2026-08-16",
    projectSlugs: ["taylor-made-esthetics"],
    text:
      "Dessiah goes over and beyond, I can't speak highly enough about her " +
      "knowledge and professionalism. I promise her and her team will take " +
      "care of everything for you.",
  },
  {
    author: "Jorge Figueroa",
    rating: 5,
    date: "2026-08-13",
    projectSlugs: ["lomeli-financial"],
    text:
      "I'm really pleased with the page I received. It looks clean, " +
      "professional, and gives my business the look I was going for. " +
      "Dessiah was easy to work with, answered my questions quickly, and " +
      "made the whole process pretty simple. Definitely recommend them if " +
      "you need a landing page or website!",
  },
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
    context: "Cypress, TX",
    projectSlugs: ["gin-and-jack"],
    text:
      "Amazing services!! They operate very efficiently and communicate so " +
      "well! A very smooth experience, I would definitely recommend!",
  },
];

/** True once at least one review has been transcribed. */
export const HAS_REVIEWS = REVIEWS.length > 0;

const BY_SLUG = new Map(projects.map((p) => [p.slug, p]));

/** The portfolio entries behind a review, minus any slug that no longer exists. */
export function reviewProjects(review: Review): Project[] {
  return (review.projectSlugs ?? [])
    .map((slug) => BY_SLUG.get(slug))
    .filter((p): p is Project => p !== undefined);
}
