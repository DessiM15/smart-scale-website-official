/**
 * The locations whose screens carry the ads.
 *
 * One today. A second is coming, which is why advertisers carry a `venueId`
 * and the sidebar has a switcher, and why this list exists at all rather than
 * the name being typed into a heading. When the second location signs, add it
 * here; everything that reads `venueOf` follows.
 */

export type Venue = {
  id: string;
  name: string;
  /** Shown under the name in the switcher. */
  place: string;
  /** Slides in the loop, and how many of them are for sale. */
  slides: number;
  sellable: number;
};

export const VENUES: Venue[] = [
  {
    id: "mex-taco-house",
    name: "Mex Taco House",
    place: "Katy, TX",
    slides: 18,
    sellable: 16,
  },
];

export const DEFAULT_VENUE_ID = VENUES[0].id;

export function venueOf(id?: string | null): Venue {
  return VENUES.find((v) => v.id === id) ?? VENUES[0];
}
