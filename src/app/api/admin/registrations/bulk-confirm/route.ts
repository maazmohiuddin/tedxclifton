import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/registrations/bulk-confirm
 * Body: { ids: string[] }
 * Marks each un-confirmed registration as confirmed (no email sent).
 */
export async function POST(request: Request) {
  const auth = createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: isAdmin } = await auth.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not an admin." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array." }, { status: 400 });
  }

  const svc = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await svc
    .from("registrations")
    .update({ confirmed_at: now, confirmed_by: user.id })
    .in("id", ids as string[])
    .is("confirmed_at", null)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, confirmed: (data ?? []).length });
}
