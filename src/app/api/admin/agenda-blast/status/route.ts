import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import { AGENDA_SUBJECT } from "@/lib/email/invitation";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = createServiceClient();

  // All contacts = delivered invitation emails UNION registered attendees
  const [{ data: sentRecords }, { data: registrations }] = await Promise.all([
    svc.from("email_send_records").select("email").eq("delivery_status", "sent"),
    svc.from("registrations").select("email"),
  ]);

  const allEmails = Array.from(new Set([
    ...(sentRecords ?? []).map(r => (r.email as string).toLowerCase()),
    ...(registrations ?? []).map(r => (r.email as string).toLowerCase()),
  ]));

  // Agenda blast log IDs (any send whose subject matches the agenda subject)
  const { data: agendaLogs } = await svc
    .from("bulk_email_logs")
    .select("id")
    .eq("subject", AGENDA_SUBJECT);

  const agendaLogIds = (agendaLogs ?? []).map(l => l.id as string);

  let agendaSentEmails: string[] = [];
  if (agendaLogIds.length > 0) {
    const { data: agendaRecords } = await svc
      .from("email_send_records")
      .select("email")
      .in("log_id", agendaLogIds)
      .eq("delivery_status", "sent");
    agendaSentEmails = Array.from(new Set((agendaRecords ?? []).map(r => (r.email as string).toLowerCase())));
  }

  const agendaSentSet = new Set(agendaSentEmails);
  const remaining = allEmails.filter(e => !agendaSentSet.has(e));

  return NextResponse.json({
    total: allEmails.length,
    sent: agendaSentEmails.length,
    remaining: remaining.length,
    remainingEmails: remaining,
  });
}
