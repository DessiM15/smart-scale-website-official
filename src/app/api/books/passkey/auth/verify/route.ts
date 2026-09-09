/**
 * POST /api/books/passkey/auth/verify
 *
 * Checks the signed challenge and opens the books for a day.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { audit } from "@/lib/books/audit";
import { finishAuthentication, setBooksSession } from "@/lib/books/passkeys";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isSignedIn())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { challengeId?: string; response?: AuthenticationResponseJSON };
  if (!body.challengeId || !body.response) return NextResponse.json({ error: "Something didn't come through. Try again." }, { status: 400 });

  const result = await finishAuthentication(req, body.challengeId, body.response);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  await setBooksSession(result.passkey.who, result.passkey.id);
  await audit({ who: result.passkey.who, action: "books.unlock", target: result.passkey.id, summary: `Unlocked the books with ${result.passkey.label}.` });
  return NextResponse.json({ ok: true, who: result.passkey.who }, { headers: { "Cache-Control": "no-store" } });
}
