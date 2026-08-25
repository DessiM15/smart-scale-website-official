/**
 * The ad artwork on file for each client.
 *
 * The slide itself goes to Vercel Blob and only a small record of it goes to
 * Redis — a 1920×1080 slide is orders of magnitude larger than everything else
 * in this database put together, and stuffing it in would make every roster
 * read pay for it.
 *
 * Blob is called over its REST API with `fetch` rather than through
 * `@vercel/blob`, for the same reasons the rest of this folder talks to
 * Upstash, Twilio and Resend that way: no dependency, no lockfile churn, and a
 * send path that can be pointed somewhere else under test. Like those, it
 * degrades to a recorded failure when unconfigured instead of throwing.
 */

import { randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "./redis";

/**
 * A server action's whole request body has to fit inside Vercel's 4.5 MB
 * function limit, so the cap is set below it with room for the rest of the
 * form. Still images fit comfortably; video needs a browser-direct upload,
 * which is a different piece of work.
 */
export const ARTWORK_MAX_BYTES = 4 * 1024 * 1024;

export const ARTWORK_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

const KEY = (advertiserId: string) => `ads:artwork:${advertiserId}`;

export type Artwork = {
  id: string;
  advertiserId: string;
  /** Public Blob URL. Unguessable, but public — never put a contract here. */
  url: string;
  /** Blob's own path, needed to delete it later. */
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  /** What this version is, in your words: "spring menu", "new phone number". */
  note: string;
  uploadedAt: string;
};

export function isArtworkStoreConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Overridable so the upload path can be pointed at a local stand-in under test. */
function blobBase(): string {
  return (process.env.BLOB_API_BASE || "https://blob.vercel-storage.com").replace(
    /\/$/,
    "",
  );
}

export function validateArtwork(file: File): string | null {
  if (!ARTWORK_TYPES.includes(file.type)) {
    return "Use a PNG, JPG, WEBP or GIF — those are what the screens take.";
  }
  if (file.size > ARTWORK_MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That file is ${mb} MB. The limit is 4 MB — export it a little smaller.`;
  }
  return null;
}

/* --------------------------------- storage -------------------------------- */

type BlobPutResponse = { url?: string; pathname?: string };

/**
 * Age out nothing and overwrite nothing: every upload is its own object, so
 * last spring's slide is still there when a client asks what we ran for them.
 */
async function putBlob(
  path: string,
  body: Buffer,
  contentType: string,
): Promise<{ ok: true; url: string; pathname: string } | { ok: false; error: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return { ok: false, error: "BLOB_READ_WRITE_TOKEN is not set" };

  try {
    const res = await fetch(`${blobBase()}/${path}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "x-api-version": "7",
        "x-content-type": contentType,
        // The path already carries a UUID, so a second random suffix would only
        // make the URL harder to read.
        "x-add-random-suffix": "0",
        "x-cache-control-max-age": "31536000",
      },
      body: new Uint8Array(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, error: `Blob ${res.status}: ${detail.slice(0, 200)}` };
    }

    const parsed = (await res.json()) as BlobPutResponse;
    if (!parsed.url) return { ok: false, error: "Blob returned no URL" };
    return { ok: true, url: parsed.url, pathname: parsed.pathname ?? path };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "upload failed",
    };
  }
}

async function removeBlob(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  try {
    await fetch(`${blobBase()}/delete`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "x-api-version": "7",
        "content-type": "application/json",
      },
      body: JSON.stringify({ urls: [url] }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // A stranded blob costs a fraction of a cent and nothing else. Failing the
    // whole delete over it would leave the record visible with no file behind it.
  }
}

/* --------------------------------- records -------------------------------- */

export async function listArtwork(advertiserId: string): Promise<Artwork[]> {
  const [raw] = await redisPipeline([["LRANGE", KEY(advertiserId), 0, 49]]);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      try {
        return JSON.parse(String(entry)) as Artwork;
      } catch {
        return null;
      }
    })
    .filter((a): a is Artwork => a !== null);
}

/** The slide currently on the screens — the most recent upload. */
export async function currentArtwork(advertiserId: string): Promise<Artwork | null> {
  const [first] = await listArtwork(advertiserId);
  return first ?? null;
}

export async function uploadArtwork(
  advertiserId: string,
  file: File,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const invalid = validateArtwork(file);
  if (invalid) return { ok: false, error: invalid };

  const id = randomUUID();
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)
    : "png";

  const stored = await putBlob(
    `ads/artwork/${advertiserId}/${id}.${extension}`,
    Buffer.from(await file.arrayBuffer()),
    file.type,
  );
  if (!stored.ok) return { ok: false, error: stored.error };

  const record: Artwork = {
    id,
    advertiserId,
    url: stored.url,
    pathname: stored.pathname,
    filename: file.name.slice(0, 120),
    contentType: file.type,
    size: file.size,
    note: note.slice(0, 200),
    uploadedAt: new Date().toISOString(),
  };

  // Newest first, so the head of the list is what's on the screens today.
  const ok = await redisWrite([
    ["LPUSH", KEY(advertiserId), JSON.stringify(record)],
    ["LTRIM", KEY(advertiserId), 0, 49],
  ]);
  if (!ok) {
    // The file landed but the record didn't, which would leave an orphan
    // nothing can ever reach. Take the file back out.
    await removeBlob(stored.url);
    return { ok: false, error: "Saved the file but couldn't record it — try again." };
  }
  return { ok: true };
}

export async function deleteArtwork(
  advertiserId: string,
  id: string,
): Promise<boolean> {
  const all = await listArtwork(advertiserId);
  const target = all.find((a) => a.id === id);
  if (!target) return false;

  const kept = all.filter((a) => a.id !== id);
  const commands: (string | number)[][] = [["DEL", KEY(advertiserId)]];
  // LPUSH prepends, so replaying the kept records in reverse restores the order.
  if (kept.length > 0) {
    commands.push([
      "RPUSH",
      KEY(advertiserId),
      ...kept.map((a) => JSON.stringify(a)),
    ]);
  }

  const ok = await redisWrite(commands);
  if (ok) await removeBlob(target.url);
  return ok;
}

/** How long since the slide was last refreshed. Null when there is no artwork. */
export function artworkAgeDays(artwork: Artwork | null): number | null {
  if (!artwork) return null;
  const then = Date.parse(artwork.uploadedAt);
  if (!Number.isFinite(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}
