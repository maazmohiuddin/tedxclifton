/**
 * GET  /api/admin/bulk-email/history — list logs
 * DELETE /api/admin/bulk-email/history?id=<log_id> — delete a log
 * Admin-only.
 */
import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = createServiceClient();

  const { data: logs, error } = await svc
    .from("bulk_email_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!logs || logs.length === 0) return NextResponse.json({ logs: [] });

  const logIds = logs.map(l => l.id);

  const [{ data: records }, { data: tokens }] = await Promise.all([
    svc
      .from("email_send_records")
      .select("id, log_id, email, delivery_status, mx_valid, opened_at, open_count, last_opened_at, smtp_error")
      .in("log_id", logIds)
      .order("email", { ascending: true }),
    svc
      .from("vip_invite_tokens")
      .select("record_id, token, expires_at, redeemed_at")
      .in("log_id", logIds),
  ]);

  // Index tokens by record_id for O(1) lookup
  const tokenByRecord = new Map<string, { token: string; expires_at: string; redeemed_at: string | null }>();
  for (const t of tokens ?? []) {
    if (t.record_id) tokenByRecord.set(t.record_id, t);
  }

  const recordsByLog = new Map<string, object[]>();
  for (const rec of records ?? []) {
    const tok = tokenByRecord.get(rec.id) ?? null;
    const enriched = {
      ...rec,
      vip_token:        tok?.token        ?? null,
      token_expires_at: tok?.expires_at   ?? null,
      token_redeemed_at: tok?.redeemed_at ?? null,
    };
    const arr = recordsByLog.get(rec.log_id) ?? [];
    arr.push(enriched);
    recordsByLog.set(rec.log_id, arr);
  }

  const enriched = logs.map(log => {
    const recs = (recordsByLog.get(log.id) ?? []) as Array<{ open_count?: number; vip_token?: string | null }>;
    const totalOpens   = recs.reduce((sum, r) => sum + (r.open_count ?? 0), 0);
    const uniqueOpeners = recs.filter(r => (r.open_count ?? 0) > 0).length;
    const vipTokensSent = recs.filter(r => r.vip_token).length;
    return { ...log, records: recs, total_opens: totalOpens, unique_openers: uniqueOpeners, vip_tokens_sent: vipTokensSent };
  });

  return NextResponse.json({ logs: enriched });
}

export async function DELETE(req: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const svc = createServiceClient();
  const { error } = await svc.from("bulk_email_logs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
