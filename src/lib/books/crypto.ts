/**
 * Encryption for the books: receipts, vault documents, the EIN.
 *
 * The file store has no per-request authentication; its protection is that
 * a file's address is unguessable and never disclosed. That is fine for an
 * ad slide. It is not fine for an EIN letter or a tax return, so anything
 * the books put in storage is sealed first with a key that lives only in
 * the environment. Storage never sees plaintext, and an address that leaks
 * yields nothing readable.
 *
 * AES-256-GCM, a fresh 12-byte nonce per file, the 16-byte tag on the end.
 * The sealed form is: nonce ‖ ciphertext ‖ tag. The key is 32 bytes,
 * base64 in BOOKS_FILE_KEY. Lose the key and every sealed file is gone for
 * good, which is why the Setup page says so in red.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const NONCE_BYTES = 12;
const TAG_BYTES = 16;

function keyBytes(): Buffer | null {
  const raw = process.env.BOOKS_FILE_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw.trim(), "base64");
  return key.byteLength === 32 ? key : null;
}

export function isFileKeyConfigured(): boolean {
  return keyBytes() !== null;
}

/** Whether a key is set at all, and whether it is the right shape. */
export function describeFileKey(): string {
  const raw = process.env.BOOKS_FILE_KEY;
  if (!raw) return "BOOKS_FILE_KEY is not set.";
  return keyBytes() ? "Set, 32 bytes." : "Set, but it is not 32 bytes of base64. Generate a new one.";
}

export function sealBytes(plain: Buffer): Buffer {
  const key = keyBytes();
  if (!key) throw new Error("BOOKS_FILE_KEY is not set");
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([nonce, body, cipher.getAuthTag()]);
}

export function openBytes(sealed: Buffer): Buffer {
  const key = keyBytes();
  if (!key) throw new Error("BOOKS_FILE_KEY is not set");
  if (sealed.byteLength < NONCE_BYTES + TAG_BYTES) throw new Error("sealed data is too short");
  const nonce = sealed.subarray(0, NONCE_BYTES);
  const tag = sealed.subarray(sealed.byteLength - TAG_BYTES);
  const body = sealed.subarray(NONCE_BYTES, sealed.byteLength - TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

/** A short secret (an EIN, an account number) as a base64 string for the database. */
export function sealText(plain: string): string {
  return sealBytes(Buffer.from(plain, "utf8")).toString("base64");
}

export function openText(sealed: string): string {
  return openBytes(Buffer.from(sealed, "base64")).toString("utf8");
}
