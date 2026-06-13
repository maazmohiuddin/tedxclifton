import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const email = new URL(req.url).searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "email param required" }, { status: 400 });

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("email_send_records")
    .select("id, sent_at, delivery_status, smtp_message_id, log_id, bulk_email_logs(subject)")
    .eq("email", email)
    .order("sent_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records = (data ?? []).map((r: any) => ({
    id: r.id as string,
    sent_at: r.sent_at as string,
    delivery_status: r.delivery_status as string,
    smtp_message_id: r.smtp_message_id as string | null,
    subject: (Array.isArray(r.bulk_email_logs) ? r.bulk_email_logs[0]?.subject : r.bulk_email_logs?.subject) ?? "(invitation)",
  }));

  return NextResponse.json(records);
}
