/**
 * Signed links for the website check's emails.
 *
 * Same idea and the same secret as the advertiser links next door
 * (`ADS_LINK_SECRET`), with their own payload prefixes so a token minted for
 * one purpose can never be replayed for another.
 *
 * Neither link does anything when it is merely opened. Mail scanners and link
 * previewers follow URLs on their own, so both land on a page with a button:
 * a fix request is recorded, and a person is unsubscribed, when it is pressed.
 * The one exception is the one-click unsubscribe a mail app sends as a POST.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "@/lib/business";

function sign(payload: string): string | null {
  const secret = process.env.ADS_LINK_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("base64url").slice(0, 32);
}

function matches(payload: string, token: string): boolean {
  const expected = sign(payload);
  if (!expected || !token) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Where "Fix my website for me" in an email goes. */
export function fixUrl(leadId: string): string | null {
  const token = sign(`wb-fix:${leadId}`);
  return token ? `${SITE_URL}/check/fix/${encodeURIComponent(leadId)}?t=${token}` : null;
}

export function verifyFixToken(leadId: string, token: string): boolean {
  return matches(`wb-fix:${leadId}`, token);
}

/** The unsubscribe token names the lead, so the address carries one value. */
function unsubToken(leadId: string): string | null {
  const signature = sign(`wb-unsub:${leadId}`);
  return signature ? `${leadId}.${signature}` : null;
}

export function unsubscribeUrl(leadId: string): string | null {
  const token = unsubToken(leadId);
  return token ? `${SITE_URL}/check/unsubscribe?t=${token}` : null;
}

/** The address a mail app posts to for its own unsubscribe button. */
export function oneClickUnsubscribeUrl(leadId: string): string | null {
  const token = unsubToken(leadId);
  return token ? `${SITE_URL}/api/wb/unsubscribe?t=${token}` : null;
}

/** The lead an unsubscribe token belongs to, or null when it is not ours. */
export function leadFromUnsubToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const leadId = token.slice(0, dot);
  return matches(`wb-unsub:${leadId}`, token.slice(dot + 1)) ? leadId : null;
}
