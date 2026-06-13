import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/registrations/remove-duplicates
 * Deletes all but the oldest registration for any email that appears more than once.
 * Returns { removed: number }.
 */
export async function POST() {
  const auth = createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: isAdmin } = await auth.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not an admin." }, { status: 403 });

  const svc = createServiceClient();

  // Find IDs of duplicate rows (keep the oldest per email).
  const { data: allRegs, error: fetchErr } = await svc
    .from("registrations")
    .select("id, email, created_at")
    .order("created_at", { ascending: true });

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const seen = new Map<string, string>(); // email → first (oldest) id
  const toDelete: string[] = [];

  for (const r of (allRegs ?? [])) {
    const key = (r.email as string).toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, r.id as string);
    } else {
      toDelete.push(r.id as string);
    }
  }

  if (toDelete.length === 0) return NextResponse.json({ ok: true, removed: 0 });

  const { error: delErr } = await svc
    .from("registrations")
    .delete()
    .in("id", toDelete);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, removed: toDelete.length });
}
