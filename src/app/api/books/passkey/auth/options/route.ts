/**
 * POST /api/books/passkey/auth/options
 *
 * The challenge for unlocking the books. Behind the shared key like the
 * rest of the portal; the passkey is the second door, not the first.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { authenticationOptions, booksLocked } from "@/lib/books/passkeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isSignedIn())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!(await booksLocked())) return NextResponse.json({ error: "No passkeys are enrolled yet. The books are open." }, { status: 400 });
  const { options, challengeId } = await authenticationOptions(req);
  return NextResponse.json({ options, challengeId }, { headers: { "Cache-Control": "no-store" } });
}
