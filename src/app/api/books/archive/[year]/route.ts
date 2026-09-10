/**
 * The accountant pack, as a download: GET /api/books/archive/<year>[?category=<id>]
 *
 * Streams a zip of the year, or one category folder of it. Photos are
 * unsealed here, one at a time, and never sit anywhere in the clear. Signed
 * in and, once anyone has a passkey, unlocked with one; every download is
 * in the audit log because a year of receipts leaving is worth a line.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { isYear } from "@/lib/books/archive";
import { audit } from "@/lib/books/audit";
import { categoryOf, isCategoryId } from "@/lib/books/categories";
import { packEntries, packFileName } from "@/lib/books/pack";
import { booksAccess } from "@/lib/books/passkeys";
import { zipStream } from "@/lib/books/zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A year of photos takes a while to read back and unseal. */
export const maxDuration = 60;

export async function GET(req: NextRequest, { params }: { params: Promise<{ year: string }> }) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const access = await booksAccess();
  if (!access.ok) {
    return NextResponse.json({ error: "The books are locked. Unlock them with a passkey." }, { status: 403 });
  }

  const { year } = await params;
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  if (!isYear(year) || (category && !isCategoryId(category))) {
    return NextResponse.json({ error: "No such year or folder." }, { status: 404 });
  }

  await audit({
    who: access.who || "someone with the shared key",
    action: "archive.download",
    target: category ? `${year}/${category}` : year,
    summary: `Downloaded the ${year}${category ? ` ${categoryOf(category).label}` : ""} receipts and books.`,
  });

  const name = packFileName({ year, category });
  return new Response(zipStream(packEntries({ year, category })), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
