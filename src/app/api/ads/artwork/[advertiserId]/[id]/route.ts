/**
 * Serves ad artwork: GET /api/ads/artwork/<advertiserId>/<id>
 *
 * The Blob store is private, so an artwork URL is not loadable by a browser —
 * the bytes come back through here, and only for someone already signed in.
 *
 * Artwork is a public ad and not especially sensitive, but the store's access
 * mode is fixed at creation and the same store holds signed contracts. Serving
 * everything the same way is simpler than two stores and leaves no path where
 * a file's address is worth having on its own.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { findArtwork } from "@/lib/ads/artwork";
import { getBlob } from "@/lib/ads/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ advertiserId: string; id: string }> },
) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { advertiserId, id } = await params;
  const record = await findArtwork(advertiserId, id);
  if (!record) {
    return NextResponse.json({ error: "No such artwork." }, { status: 404 });
  }

  const file = await getBlob(record.url);
  if (!file) {
    return NextResponse.json(
      { error: "The artwork is recorded but couldn't be read back." },
      { status: 502 },
    );
  }

  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": file.contentType ?? record.contentType,
      // Artwork never changes once uploaded — a new version is a new record —
      // so the browser may hold it, but only privately.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
