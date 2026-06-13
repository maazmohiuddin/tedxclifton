import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncInboxEmails } from "@/lib/imap-sync";

export const runtime = "nodejs";
export const maxDuration = 55;

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await syncInboxEmails();
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}
