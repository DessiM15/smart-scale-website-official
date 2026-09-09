/**
 * Serves a receipt photo: GET /api/ads/receipt/<id>
 *
 * The only way a receipt leaves the private store. The Blob address stays in
 * the database and is fetched here, server-side, so no browser ever holds it.
 * Signed in or nothing.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { booksAccess } from "@/lib/books/passkeys";
import { readReceiptFile } from "@/lib/books/receipts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!(await booksAccess()).ok) {
    return NextResponse.json({ error: "The books are locked. Unlock them with a passkey." }, { status: 403 });
  }

  const { id } = await params;
  const found = await readReceiptFile(id);
  if (!found) {
    return NextResponse.json({ error: "No such receipt, or it couldn't be read back." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(found.bytes), {
    headers: {
      "Content-Type": found.receipt.contentType,
      "Content-Disposition": `inline; filename="receipt-${id.slice(0, 8)}.jpg"`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
