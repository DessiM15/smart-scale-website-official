/**
 * Access control for the internal advertising pages.
 *
 * One shared passphrase in ADS_ADMIN_KEY, exchanged for an httpOnly cookie so
 * the key never sits in a URL or in browser history — this page can write to
 * the roster, so it gets a real session rather than the `?key=` query the
 * read-only scan report uses.
 */

import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";

const COOKIE = "ss_ads_admin";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** The cookie stores a hash, never the passphrase itself. */
function tokenFor(key: string): string {
  return createHash("sha256").update(`smart-scale-ads:${key}`).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADS_ADMIN_KEY);
}

export async function isSignedIn(): Promise<boolean> {
  const key = process.env.ADS_ADMIN_KEY;
  if (!key) return false;
  const cookie = (await cookies()).get(COOKIE)?.value;
  if (!cookie) return false;
  return constantTimeEqual(cookie, tokenFor(key));
}

/** Must be called from a Server Action or Route Handler — it sets a cookie. */
export async function signIn(attempt: string): Promise<boolean> {
  const key = process.env.ADS_ADMIN_KEY;
  if (!key || !constantTimeEqual(attempt.trim(), key)) return false;
  (await cookies()).set(COOKIE, tokenFor(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return true;
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
