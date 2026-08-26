/**
 * Private files on a client's record — signed agreements handled outside the
 * portal, and anything else worth keeping.
 *
 * This is deliberately not the artwork store. Artwork is a public ad and its
 * Blob address can be handed straight to a browser. A signed agreement carries
 * a name, a rate and a signature, so its address is never rendered anywhere:
 * the file goes to Blob under an unguessable path, that path is kept in the
 * database, and the bytes are only ever served back through a route that checks
 * the session first.
 *
 * Worth being straight about the limit of that. The path is unguessable and is
 * never disclosed, which is what protects it — but Blob has no per-request
 * authentication, so anyone who somehow obtained the raw address could read the
 * file. For a small business's advertising agreements that is a reasonable
 * trade against the cost of running a private store. It would not be reasonable
 * for identity documents or payment details, so don't put those here.
 */

import { createHash, randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "./redis";

/** Same ceiling as artwork: a server action's body must fit Vercel's limit. */
export const DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;

export const DOCUMENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const KEY = (id: string) => `ads:document:${id}`;
const INDEX = (advertiserId: string) => `ads:documents:${advertiserId}`;

export type DocumentKind = "agreement" | "other";

export type DocumentRecord = {
  id: string;
  advertiserId: string;
  kind: DocumentKind;
  /** What it is, in your words. */
  label: string;
  filename: string;
  contentType: string;
  size: number;
  /** SHA-256 of the bytes, so a file on record can be shown to be unchanged. */
  sha256: string;
  /**
   * The Blob address. Server-side only — never send this to a browser or put
   * it in a page. Read the file through /api/ads/document/<id> instead.
   */
  blobUrl: string;
  uploadedAt: string;
};

export function isDocumentStoreConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobBase(): string {
  return (process.env.BLOB_API_BASE || "https://blob.vercel-storage.com").replace(
    /\/$/,
    "",
  );
}

export function validateDocument(file: File): string | null {
  if (!DOCUMENT_TYPES.includes(file.type)) {
    return "Use a PDF, Word document, or a photo of the signed pages.";
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That file is ${mb} MB. The limit is 4 MB — try a smaller scan.`;
  }
  return null;
}

/* --------------------------------- storage -------------------------------- */

function parse(raw: unknown): DocumentRecord | null {
  try {
    return raw ? (JSON.parse(String(raw)) as DocumentRecord) : null;
  } catch {
    return null;
  }
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  return parse(raw);
}

export async function listDocuments(
  advertiserId: string,
): Promise<DocumentRecord[]> {
  const [ids] = await redisPipeline([["SMEMBERS", INDEX(advertiserId)]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];

  const [values] = await redisPipeline([["MGET", ...list.map(KEY)]]);
  return (Array.isArray(values) ? values : [])
    .map(parse)
    .filter((d): d is DocumentRecord => d !== null)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export type UploadResult =
  | { ok: true; document: DocumentRecord }
  | { ok: false; error: string };

export async function uploadDocument(
  advertiserId: string,
  file: File,
  input: { kind: DocumentKind; label: string },
): Promise<UploadResult> {
  const invalid = validateDocument(file);
  if (invalid) return { ok: false, error: invalid };

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return { ok: false, error: "BLOB_READ_WRITE_TOKEN is not set" };

  const id = randomUUID();
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)
    : "pdf";

  try {
    const bytes = Buffer.from(await file.arrayBuffer());

    const res = await fetch(`${blobBase()}/ads/private/${advertiserId}/${id}.${extension}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "x-api-version": "7",
        "x-content-type": file.type,
        // Extra entropy on top of the UUID. The address is the only thing
        // standing between this file and anyone who guesses at it.
        "x-add-random-suffix": "1",
        // Never let a shared cache hold a copy of a contract.
        "x-cache-control-max-age": "0",
      },
      body: new Uint8Array(bytes),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, error: `Blob ${res.status}: ${detail.slice(0, 200)}` };
    }

    const parsed = (await res.json()) as { url?: string };
    if (!parsed.url) return { ok: false, error: "Blob returned no address" };

    const record: DocumentRecord = {
      id,
      advertiserId,
      kind: input.kind,
      label: input.label.slice(0, 160),
      filename: file.name.slice(0, 160),
      contentType: file.type,
      size: file.size,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      blobUrl: parsed.url,
      uploadedAt: new Date().toISOString(),
    };

    const ok = await redisWrite([
      ["SET", KEY(id), JSON.stringify(record)],
      ["SADD", INDEX(advertiserId), id],
    ]);
    if (!ok) {
      await removeBlob(parsed.url);
      return { ok: false, error: "Saved the file but couldn't record it — try again." };
    }

    return { ok: true, document: record };
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
    // A stranded blob costs nothing. Failing the delete over it would leave a
    // record pointing at a file the reader can no longer be shown.
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  const record = await getDocument(id);
  if (!record) return false;

  const ok = await redisWrite([
    ["DEL", KEY(id)],
    ["SREM", INDEX(record.advertiserId), id],
  ]);
  if (ok) await removeBlob(record.blobUrl);
  return ok;
}

/** Where the portal links to. Never the Blob address. */
export function documentHref(id: string): string {
  return `/api/ads/document/${encodeURIComponent(id)}`;
}
