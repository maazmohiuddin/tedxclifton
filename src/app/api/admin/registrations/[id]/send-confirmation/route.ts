import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import { sendRegistrationConfirmation } from "@/lib/email";
import { TRACK_LABELS } from "@/lib/types";
import type { Registration } from "@/lib/types";

/**
 * POST /api/admin/registrations/[id]/send-confirmation
 * Sends (or resends) the branded "slot confirmed" email via SMTP,
 * marks the registration as confirmed, and stamps the audit columns.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: isAdmin } = await auth.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not an admin." }, { status: 403 });

  const svc = createServiceClient();
  const { data: reg, error: fetchErr } = await svc
    .from("registrations")
    .select("*")
    .eq("id", params.id)
    .single<Registration>();

  if (fetchErr || !reg) {
    return NextResponse.json({ error: fetchErr?.message ?? "Registration not found." }, { status: 404 });
  }

  try {
    await sendRegistrationConfirmation({
      to: reg.email,
      fullName: reg.full_name,
      registrationId: reg.id,
      track: TRACK_LABELS[reg.track],
      role: reg.role,
      resend: (reg.confirmation_email_count ?? 0) > 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Email send failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await svc
    .from("registrations")
    .update({
      confirmed_at: reg.confirmed_at ?? now,
      confirmed_by: reg.confirmed_by ?? user.id,
      confirmation_email_sent_at: now,
      confirmation_email_count: (reg.confirmation_email_count ?? 0) + 1,
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (updErr || !updated) {
    return NextResponse.json({ error: updErr?.message ?? "Could not update registration." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, registration: updated });
}
