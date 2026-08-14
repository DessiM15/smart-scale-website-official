/**
 * Minimal Upstash Redis client over its REST API.
 *
 * Shared by the QR scan counters and the advertiser roster. Deliberately
 * dependency-free — Upstash speaks plain HTTPS, so this is `fetch` and nothing
 * else. Every call degrades to a no-op rather than throwing, so a database
 * outage never takes a page down; callers decide what an empty result means.
 *
 * Env (either naming works; Vercel's Upstash integration sets one or the other):
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 *   KV_REST_API_URL        / KV_REST_API_TOKEN
 */

export type RedisCommand = (string | number)[];

function credentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function isRedisConfigured(): boolean {
  return credentials() !== null;
}

/**
 * Whether the database actually answers — not just whether the variables exist.
 *
 * These are different failures and they look identical from the outside. The
 * common one is a token rotated in the Upstash console while Vercel still holds
 * the old value: every variable is present, so a configuration check passes,
 * and then every write silently fails.
 */
export async function isRedisReachable(): Promise<boolean> {
  const [pong] = await redisPipeline([["PING"]], 3000);
  return typeof pong === "string" && pong.toUpperCase() === "PONG";
}

/** Runs a batch of commands in one round trip. Returns [] on any failure. */
export async function redisPipeline(
  commands: RedisCommand[],
  timeoutMs = 2500,
): Promise<unknown[]> {
  const creds = credentials();
  if (!creds || commands.length === 0) return [];
  try {
    const res = await fetch(`${creds.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { result?: unknown; error?: string }[];
    return Array.isArray(json) ? json.map((r) => r?.result ?? null) : [];
  } catch {
    return [];
  }
}

/**
 * Like redisPipeline, but reports failure instead of swallowing it. Writes use
 * this — silently losing an advertiser record is worse than showing an error.
 */
export async function redisWrite(commands: RedisCommand[]): Promise<boolean> {
  const creds = credentials();
  if (!creds) return false;
  try {
    const res = await fetch(`${creds.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { error?: string }[];
    return Array.isArray(json) && !json.some((r) => r?.error);
  } catch {
    return false;
  }
}
