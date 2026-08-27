/**
 * File storage, through the Vercel Blob SDK.
 *
 * This folder calls Upstash, Twilio and Plunk over plain `fetch` on purpose —
 * one endpoint, one static key, no dependency worth carrying. Blob is the
 * exception, and it took a while to see why: a connected store authenticates
 * with a short-lived OIDC token that Vercel rotates (`BLOB_STORE_ID` +
 * `VERCEL_OIDC_TOKEN`), not the long-lived `BLOB_READ_WRITE_TOKEN` the older
 * docs describe. Refreshing a rotating credential by hand is precisely the job
 * an SDK should be doing, so here it does it.
 *
 * The store is **private**. Read access requires authentication, so a blob URL
 * is useless on its own and nothing can be handed straight to a browser — every
 * file is streamed back through a route that checks the session first. That is
 * a stronger position than the unguessable-but-public URLs this started with,
 * and it isn't a choice we can revisit: a store's access mode is fixed when the
 * store is created.
 */

import { del, get, put } from "@vercel/blob";

/** The store's access mode. Fixed at store creation; ours is private. */
const ACCESS = "private" as const;

/**
 * Whether a store is reachable from this deployment.
 *
 * Either credential will do: OIDC is what a connected store uses now, and the
 * read-write token is the older form, still used from outside Vercel.
 */
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * What this deployment can see, for the screen. Names only — never values.
 *
 * Written for the person who has just connected a store in Vercel and is being
 * told it isn't there, because that is the only time anyone reads it.
 */
export function describeBlobEnv(): string {
  const storeId = Boolean(process.env.BLOB_STORE_ID);
  const oidc = Boolean(process.env.VERCEL_OIDC_TOKEN);
  const token = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (storeId && oidc) return "Connected: BLOB_STORE_ID and VERCEL_OIDC_TOKEN.";
  if (storeId) {
    return "BLOB_STORE_ID is set but VERCEL_OIDC_TOKEN isn't. Vercel issues that token at run time — if this is production, redeploy.";
  }
  if (token) return "Connected: BLOB_READ_WRITE_TOKEN.";

  const visible = Object.keys(process.env).length;
  return `No Blob credentials here — neither BLOB_STORE_ID nor BLOB_READ_WRITE_TOKEN, out of ${visible} environment variables this deployment can see. Connect the store to this project with Production ticked, then redeploy.`;
}

/* --------------------------------- writing -------------------------------- */

export type PutResult =
  | { ok: true; url: string; pathname: string }
  | { ok: false; error: string };

/**
 * Stores one file.
 *
 * `overwrite` exists for the nightly backup, which deliberately writes the same
 * path every day. Everything else gets a fresh path per upload — the SDK
 * refuses a repeated pathname otherwise, which is the right default for files
 * that must never quietly replace one another.
 */
export async function putBlob(
  pathname: string,
  body: Buffer,
  contentType: string,
  options: { overwrite?: boolean; randomSuffix?: boolean } = {},
): Promise<PutResult> {
  if (!isBlobConfigured()) {
    return { ok: false, error: "No Blob store is connected to this deployment" };
  }

  try {
    // The SDK takes a Buffer directly; wrapping it was a habit carried over
    // from the raw fetch this replaced.
    const blob = await put(pathname, body, {
      access: ACCESS,
      contentType,
      allowOverwrite: options.overwrite ?? false,
      addRandomSuffix: options.randomSuffix ?? false,
    });
    return { ok: true, url: blob.url, pathname: blob.pathname };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "upload failed",
    };
  }
}

/* --------------------------------- reading -------------------------------- */

export type BlobRead = { stream: ReadableStream; contentType?: string };

/**
 * Reads one file back. Private blobs are delivered through the function rather
 * than the CDN, so the caller streams this on to whoever it has already
 * authenticated.
 */
export async function getBlob(url: string): Promise<BlobRead | null> {
  if (!isBlobConfigured()) return null;
  try {
    const result = await get(url, { access: ACCESS });
    if (!result?.stream) return null;
    return {
      stream: result.stream as unknown as ReadableStream,
      contentType: result.blob?.contentType ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Removes a file. Never throws: a stranded blob costs a fraction of a cent, and
 * failing a delete over it would leave a record pointing at a file the reader
 * can no longer be shown.
 */
export async function removeBlob(url: string): Promise<void> {
  if (!isBlobConfigured()) return;
  try {
    await del(url);
  } catch {
    /* see above */
  }
}
