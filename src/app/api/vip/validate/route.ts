/**
 * GET /api/vip/validate?token=XXX
 * Public endpoint — validates a VIP invite token and marks it redeemed on first use.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const TOKEN_RE = /^[a-f0-9]{48}$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? "";

  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  const svc = createServiceClient();
  const { data } = await svc
    .from("vip_invite_tokens")
    .select("id, expires_at, redeemed_at")
    .eq("token", token)
    .single();

  if (!data) return NextResponse.json({ valid: false, reason: "not_found" });
  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  if (!data.redeemed_at) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      null;
    await svc
      .from("vip_invite_tokens")
      .update({ redeemed_at: new Date().toISOString(), redeemed_ip: ip })
      .eq("id", data.id);
  }

  return NextResponse.json({ valid: true });
}
