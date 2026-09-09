/**
 * Which of the two of you is at the keyboard.
 *
 * One shared key signs both people in, and that is how they want it. What
 * they do want is to know, later, who called a prospect or marked something
 * done. So the name is a cookie chosen once per browser rather than a login:
 * cheap, honest about what it is, and enough to put a name on a log line.
 */

import { cookies } from "next/headers";

const COOKIE = "ss_ads_who";
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** The two people who use this. Add a name here when a third one does. */
export const TEAM = ["Dessi", "Jay"] as const;
export type TeamMember = (typeof TEAM)[number];

export function isTeamMember(value: string): value is TeamMember {
  return (TEAM as readonly string[]).includes(value);
}

/** The name on this browser, or blank if nobody has picked one yet. */
export async function currentWho(): Promise<string> {
  const value = (await cookies()).get(COOKIE)?.value ?? "";
  return isTeamMember(value) ? value : "";
}

/** Must be called from a Server Action or Route Handler. */
export async function setWho(name: string): Promise<boolean> {
  if (!isTeamMember(name)) return false;
  (await cookies()).set(COOKIE, name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return true;
}
