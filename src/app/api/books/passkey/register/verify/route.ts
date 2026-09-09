/**
 * POST /api/books/passkey/register/verify
 *
 * Step two of enrolling: the signed response comes back, is checked against
 * the challenge, and the passkey is kept. Enrolling also signs you in.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { audit } from "@/lib/books/audit";
import { finishRegistration, setBooksSession } from "@/lib/books/passkeys";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isSignedIn())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { challengeId?: string; response?: RegistrationResponseJSON };
  if (!body.challengeId || !body.response) return NextResponse.json({ error: "Something didn't come through. Try again." }, { status: 400 });

  const result = await finishRegistration(req, body.challengeId, body.response);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  await setBooksSession(result.passkey.who, result.passkey.id);
  await audit({ who: result.passkey.who, action: "passkey.enrol", target: result.passkey.id, summary: `Enrolled a passkey: ${result.passkey.label}.` });
  return NextResponse.json({ ok: true, who: result.passkey.who, label: result.passkey.label }, { headers: { "Cache-Control": "no-store" } });
}
