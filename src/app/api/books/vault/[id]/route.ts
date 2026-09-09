/**
 * Serves a vault document: GET /api/books/vault/<id>
 *
 * Signed in, books unlocked, or nothing. The file is unsealed here and
 * streamed on; storage only ever held ciphertext.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { audit } from "@/lib/books/audit";
import { booksAccess } from "@/lib/books/passkeys";
import { readVaultDoc } from "@/lib/books/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSignedIn())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const access = await booksAccess();
  if (!access.ok) return NextResponse.json({ error: "The books are locked. Unlock them with a passkey." }, { status: 403 });

  const { id } = await params;
  let found;
  try {
    found = await readVaultDoc(id);
  } catch {
    return NextResponse.json({ error: "The file is on record but couldn't be unsealed. Is BOOKS_FILE_KEY the same key it was sealed with?" }, { status: 500 });
  }
  if (!found) return NextResponse.json({ error: "No such document, or it couldn't be read back." }, { status: 404 });

  await audit({ who: access.who, action: "vault.open", target: id, summary: `Opened ${found.doc.label}.` });
  const safeName = found.doc.filename.replace(/[^\w. -]+/g, "_") || "document";
  return new NextResponse(new Uint8Array(found.bytes), {
    headers: {
      "Content-Type": found.doc.contentType,
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
