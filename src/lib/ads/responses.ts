/**
 * What an advertiser said when asked about renewing.
 *
 * A reply is recorded as intent, never applied automatically. "Renew" from an
 * email tap is not a signed contract, and money is involved — so the roster is
 * only ever changed by a person in the tracker.
 */

import { redisPipeline, redisWrite } from "./redis";
import type { PlanId } from "./roster";

export type RenewalChoice = "renew" | "change" | "cancel";

export type RenewalResponse = {
  advertiserId: string;
  business: string;
  /** The term end this reply is about — a later term gets a fresh ask. */
  endDate: string;
  choice: RenewalChoice;
  /** Only set when they asked to change packages. */
  requestedPlan?: PlanId;
  note?: string;
  at: string;
};

const KEY = (advertiserId: string, endDate: string) =>
  `ads:response:${advertiserId}:${endDate}`;
const INDEX = "ads:responses";
const TTL_SECONDS = 400 * 24 * 60 * 60;

export async function getResponse(
  advertiserId: string,
  endDate: string,
): Promise<RenewalResponse | null> {
  const [raw] = await redisPipeline([["GET", KEY(advertiserId, endDate)]]);
  if (!raw) return null;
  try {
    return JSON.parse(String(raw)) as RenewalResponse;
  } catch {
    return null;
  }
}

export async function hasResponded(
  advertiserId: string,
  endDate: string,
): Promise<boolean> {
  return (await getResponse(advertiserId, endDate)) !== null;
}

export async function recordResponse(response: RenewalResponse): Promise<boolean> {
  const key = KEY(response.advertiserId, response.endDate);
  return redisWrite([
    ["SET", key, JSON.stringify(response)],
    ["EXPIRE", key, TTL_SECONDS],
    ["SADD", INDEX, key],
  ]);
}

/** Everything the team hasn't cleared yet, newest first. */
export async function listResponses(): Promise<RenewalResponse[]> {
  const [keys] = await redisPipeline([["SMEMBERS", INDEX]]);
  const list = Array.isArray(keys) ? keys.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list]]);
  if (!Array.isArray(values)) return [];
  return values
    .map((raw) => {
      try {
        return raw ? (JSON.parse(String(raw)) as RenewalResponse) : null;
      } catch {
        return null;
      }
    })
    .filter((r): r is RenewalResponse => r !== null)
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** Clearing a reply means "we've dealt with it", not "it never happened". */
export async function clearResponse(
  advertiserId: string,
  endDate: string,
): Promise<boolean> {
  const key = KEY(advertiserId, endDate);
  return redisWrite([
    ["DEL", key],
    ["SREM", INDEX, key],
  ]);
}
