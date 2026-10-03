/**
 * The invisible bot check on the website check form (Cloudflare Turnstile).
 *
 * Verified here, on the server, before a scan is queued. Without the two
 * keys the check is simply off, and the portal says so, which is how the
 * form can be built and previewed before the keys exist.
 */

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

/** True when the visitor passed, or when the check is not set up. */
export async function passedTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!isTurnstileConfigured() || !secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return true;
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    // Cloudflare being away is not the visitor's fault. The honeypot and the
    // rate limits still stand.
    return true;
  }
}
