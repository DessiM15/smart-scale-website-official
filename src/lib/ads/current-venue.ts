/**
 * Which location the portal is looking at.
 *
 * Today and Payments show every location with a tag on each row, because
 * one to-do list beats two. The Board, the categories and the advertiser
 * table are per location, and this cookie is which one. A cookie rather than
 * a query string so it survives navigating around, and per browser so Dessi
 * and Jay can each be looking at a different one.
 */

import { cookies } from "next/headers";
import { listVenues, venueOf, type Venue } from "./venues";

const COOKIE = "ss_ads_venue";
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** The location this browser last chose, or the first one. */
export async function currentVenue(venues?: Venue[]): Promise<Venue> {
  const all = venues ?? (await listVenues());
  const wanted = (await cookies()).get(COOKIE)?.value ?? "";
  return venueOf(all, wanted);
}

/** Must be called from a Server Action or Route Handler. */
export async function setCurrentVenue(id: string): Promise<boolean> {
  const venues = await listVenues();
  if (!venues.some((v) => v.id === id)) return false;
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return true;
}
