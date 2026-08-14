/**
 * Print-ready QR artwork for a link: /api/ads/qr/<code>?format=svg|png
 *
 * Generated on demand rather than committed as files, so a code created in the
 * tracker is downloadable a second later without anyone running a script.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { getLink } from "@/lib/ads/link-store";
import { clampPngWidth, renderPng, renderSvg } from "@/lib/ads/qr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { code } = await params;
  const link = await getLink(code);
  if (!link) {
    return NextResponse.json(
      { error: `No QR code named "${code}".` },
      { status: 404 },
    );
  }

  const filename = `qr-${link.code}`;

  if (req.nextUrl.searchParams.get("format") !== "png") {
    return new NextResponse(await renderSvg(link), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${filename}.svg"`,
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const png = await renderPng(link, clampPngWidth(req.nextUrl.searchParams.get("size")));
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    // Rasterising is the optional half — the vector is the print master.
    return NextResponse.json(
      {
        error:
          "Could not render a PNG. Download the SVG instead — it prints better anyway.",
      },
      { status: 500 },
    );
  }
}
