/**
 * One-click unsubscribe: POST /api/wb/unsubscribe?t=
 *
 * This is the address in the List-Unsubscribe header, which a mail app posts
 * to when someone presses its own unsubscribe button. Only a POST does
 * anything. Opening the address in a browser goes to the page with a button,
 * because link scanners open addresses on their own.
 */

import { NextRequest, NextResponse } from "next/server";
import { unsubscribeLead } from "@/lib/wb/check";
import { leadFromUnsubToken } from "@/lib/wb/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const leadId = leadFromUnsubToken(req.nextUrl.searchParams.get("t") ?? "");
  if (!leadId) return NextResponse.json({ ok: false }, { status: 400 });
  await unsubscribeLead(leadId).catch(() => false);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t") ?? "";
  return NextResponse.redirect(new URL(`/check/unsubscribe?t=${encodeURIComponent(token)}`, req.url));
}
