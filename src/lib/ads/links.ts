/**
 * Signed links for advertiser-facing pages.
 *
 * An advertiser should be able to answer a renewal email in one tap — no
 * account, no password. The link itself is the credential: an HMAC over the
 * advertiser and their current term end, which makes it unguessable, scoped to
 * one decision, and self-expiring. Renew someone and every link tied to their
 * old term stops working.
 */

import { createHmac, timingSafeEqual } from "crypto";

export const SITE = "https://smartscaleagent.com";

export function isLinkSigningConfigured(): boolean {
  return Boolean(process.env.ADS_LINK_SECRET);
}

function sign(payload: string): string | null {
  const secret = process.env.ADS_LINK_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret)
    .update(payload)
    .digest("base64url")
    .slice(0, 32);
}

/** Ties a token to one advertiser's one term. */
function payloadFor(advertiserId: string, endDate: string): string {
  return `renewal:${advertiserId}:${endDate}`;
}

export function renewalToken(advertiserId: string, endDate: string): string | null {
  return sign(payloadFor(advertiserId, endDate));
}

export function verifyRenewalToken(
  advertiserId: string,
  endDate: string,
  token: string,
): boolean {
  const expected = sign(payloadFor(advertiserId, endDate));
  if (!expected || !token) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The page an advertiser lands on from the email. `choice` only pre-selects an
 * option — the page still asks them to confirm, because mail scanners and
 * link previewers follow URLs and a one-tap GET must never cancel a contract.
 */
export function renewalUrl(
  advertiserId: string,
  endDate: string,
  choice?: "renew" | "change" | "cancel",
): string | null {
  const token = renewalToken(advertiserId, endDate);
  if (!token) return null;
  const params = new URLSearchParams({ t: token });
  if (choice) params.set("choice", choice);
  return `${SITE}/advertise/renew/${encodeURIComponent(advertiserId)}?${params}`;
}
