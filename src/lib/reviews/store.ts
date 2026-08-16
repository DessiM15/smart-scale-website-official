/**
 * Log of review requests we've sent.
 *
 * The only job here is preventing the same client from being asked twice.
 * Repeatedly texting a customer for a review is the fastest way to turn a
 * happy client into an annoyed one, and Twilio treats duplicate unsolicited
 * sends as a carrier-filtering risk.
 *
 * Backed by the same Upstash instance as the advertiser tooling. Degrades the
 * same way: if the database is unreachable we fail closed and refuse to send,
 * because sending without being able to record it is how duplicates happen.
 */

import { redisPipeline, isRedisConfigured } from "@/lib/ads/redis";

const KEY = "ss:review-requests";

export interface ReviewRequest {
  /** E.164, used as the dedupe key. */
  phone: string;
  name: string;
  /** Business or project the request relates to, for the operator's reference. */
  context?: string;
  sentAt: string;
  /** Set when Twilio accepted the message. */
  messageSid?: string;
}

export { isRedisConfigured };

export async function listRequests(): Promise<ReviewRequest[]> {
  const [raw] = await redisPipeline([["HGETALL", KEY]]);
  if (!raw) return [];

  // Upstash returns HGETALL as a flat [field, value, field, value, ...] array.
  const flat = Array.isArray(raw) ? (raw as string[]) : [];
  const out: ReviewRequest[] = [];
  for (let i = 1; i < flat.length; i += 2) {
    try {
      out.push(JSON.parse(flat[i]) as ReviewRequest);
    } catch {
      // A malformed row should not take down the whole list.
    }
  }
  return out.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export async function hasBeenAsked(phone: string): Promise<boolean> {
  const [raw] = await redisPipeline([["HGET", KEY, phone]]);
  return Boolean(raw);
}

export async function recordRequest(request: ReviewRequest): Promise<boolean> {
  const [res] = await redisPipeline([
    ["HSET", KEY, request.phone, JSON.stringify(request)],
  ]);
  return res !== undefined;
}

/** Lets the operator clear a row so a client can be asked again later. */
export async function forgetRequest(phone: string): Promise<void> {
  await redisPipeline([["HDEL", KEY, phone]]);
}
