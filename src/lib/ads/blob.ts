/**
 * Finding the Blob credentials, and saying so when we can't.
 *
 * Vercel usually sets `BLOB_READ_WRITE_TOKEN` when a Blob store is connected —
 * but it offers an environment-variable prefix when you connect one, and a
 * store attached with a prefix arrives as `SOMETHING_BLOB_READ_WRITE_TOKEN`
 * instead. To the app that looks identical to no store at all, which produces
 * the worst possible message: "no file storage connected" on a project where
 * the dashboard plainly shows one is.
 *
 * So the token is looked up by suffix rather than by one exact name, and when
 * nothing matches the app reports which candidates it can actually see. A
 * variable added after the last deploy is invisible until a redeploy, and that
 * is the other half of this failure — naming what is visible distinguishes the
 * two without anyone having to guess.
 */

const TOKEN_SUFFIX = "BLOB_READ_WRITE_TOKEN";

/** Every environment variable that looks like a Blob token, by name only. */
function candidateNames(): string[] {
  return Object.keys(process.env)
    .filter((name) => name.endsWith(TOKEN_SUFFIX))
    .sort((a, b) => a.length - b.length);
}

/**
 * The Blob token, whatever Vercel decided to call it. The unprefixed name wins
 * when both exist, because that is the one a person would have set deliberately.
 */
export function blobToken(): string {
  const exact = (process.env[TOKEN_SUFFIX] ?? "").trim();
  if (exact) return exact;

  for (const name of candidateNames()) {
    const value = (process.env[name] ?? "").trim();
    if (value) return value;
  }
  return "";
}

export function isBlobConfigured(): boolean {
  return Boolean(blobToken());
}

/** Overridable so the upload paths can be pointed at a stand-in under test. */
export function blobBase(): string {
  return (process.env.BLOB_API_BASE || "https://blob.vercel-storage.com").replace(
    /\/$/,
    "",
  );
}

/**
 * What this deployment can see, for the screen. Names only — never values.
 *
 * Shown when storage looks unconfigured, because "connected in Vercel but not
 * here" and "connected in Vercel after the last deploy" look the same from
 * inside the app and have different fixes.
 */
export function describeBlobEnv(): string {
  const names = candidateNames();
  if (names.length === 0) {
    return "This deployment can't see any variable ending in BLOB_READ_WRITE_TOKEN. If the store is connected in Vercel, it was almost certainly connected after this deployment was built — redeploy and it will appear.";
  }

  const empty = names.filter((n) => !(process.env[n] ?? "").trim());
  if (empty.length === names.length) {
    return `Found ${names.join(", ")}, but the value is empty. Re-connect the store in Vercel, then redeploy.`;
  }

  return `Found ${names.join(", ")}.`;
}
