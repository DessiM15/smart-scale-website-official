/**
 * Serves a receipt photo: GET /api/ads/receipt/<id>
 *
 * The only way a receipt leaves the private store. The Blob address stays in
 * the database and is fetched here, server-side, so no browser ever holds it.
 * Signed in or nothing.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { readReceiptFile } from "@/lib/books/receipts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const found = await readReceiptFile(id);
  if (!found) {
    return NextResponse.json({ error: "No such receipt, or it couldn't be read back." }, { status: 404 });
  }

  return new NextResponse(found.file.stream, {
    headers: {
      "Content-Type": found.file.contentType ?? found.receipt.contentType,
      "Content-Disposition": `inline; filename="receipt-${id.slice(0, 8)}.jpg"`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
