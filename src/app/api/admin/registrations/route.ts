import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/registrations
 * Returns a lightweight list of all registrations for import into the bulk mailer.
 */
export async function GET() {
  const auth = createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: isAdmin } = await auth.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not an admin." }, { status: 403 });

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("registrations")
    .select("id, full_name, email, track, confirmed_at, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ registrations: data ?? [] });
}
