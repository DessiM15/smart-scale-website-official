/**
 * POST /api/books/passkey/register/options
 *
 * Step one of enrolling a passkey: the challenge the phone will sign.
 * Behind the shared key, because this is also how a lost phone is replaced.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSignedIn } from "@/lib/ads/auth";
import { isTeamMember } from "@/lib/ads/who";
import { registrationOptions } from "@/lib/books/passkeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isSignedIn())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { who?: string; label?: string };
  if (!body.who || !isTeamMember(body.who)) return NextResponse.json({ error: "Pick Dessi or Jay." }, { status: 400 });
  const { options, challengeId } = await registrationOptions(req, body.who, String(body.label ?? "").slice(0, 60));
  return NextResponse.json({ options, challengeId }, { headers: { "Cache-Control": "no-store" } });
}
