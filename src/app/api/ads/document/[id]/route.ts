/**
 * Serves a client document: GET /api/ads/document/<id>
 *
 * The only way to read a file from the private store. The Blob address lives in
 * the database and is fetched server-side here, so it never reaches a browser,
 * never lands in someone's history, and can't be forwarded by accident.
 *
 * Signed in or nothing. A contract is not a QR code.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { getDocument } from "@/lib/ads/documents";
import { getBlob } from "@/lib/ads/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const record = await getDocument(id);
  if (!record) {
    return NextResponse.json({ error: "No such document." }, { status: 404 });
  }

  const file = await getBlob(record.blobUrl);
  if (!file) {
    return NextResponse.json(
      { error: "The file is recorded but couldn't be read back." },
      { status: 502 },
    );
  }

  // `inline` so a PDF opens in the tab rather than forcing a download, but the
  // filename is quoted and stripped of anything that could break the header.
  const safeName = record.filename.replace(/[^\w. -]+/g, "_") || "document";

  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": file.contentType ?? record.contentType,
      "Content-Disposition": `inline; filename="${safeName}"`,
      // Never let a proxy or a shared cache keep a copy.
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
