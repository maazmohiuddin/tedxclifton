/**
 * GET/POST /api/admin/bulk-email/preview
 * Returns rendered invitation HTML for the preview iframe.
 * Pass isVip:true in POST body to preview the gold VIP variant.
 */
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { renderInvitationEmail, type CustomInvitationParams } from "@/lib/email/invitation";

export const runtime = "nodejs";

async function authCheck() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin ? user : null;
}

function htmlResponse(html: string) {
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}

export async function GET() {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return htmlResponse(renderInvitationEmail());
}

export async function POST(req: Request) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let custom: CustomInvitationParams = {};
  try { custom = await req.json(); } catch { /* fall through */ }

  return htmlResponse(renderInvitationEmail(custom));
}
