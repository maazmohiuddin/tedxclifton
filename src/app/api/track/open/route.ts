/**
 * GET /api/track/open?rid=RECORD_ID
 *
 * Email open-tracking pixel. Called by the recipient's email client when
 * the email is rendered. Returns a 1×1 transparent GIF and records the event.
 *
 * Public endpoint — no session required. The record_id acts as an
 * unguessable opaque token (UUID v4).
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// 1×1 transparent GIF (35 bytes)
const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function gifResponse() {
  return new NextResponse(GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rid = searchParams.get("rid");

  // Silently ignore invalid or missing IDs — don't reveal anything
  if (!rid || !UUID_RE.test(rid)) return gifResponse();

  try {
    const svc = createServiceClient();
    const now = new Date().toISOString();

    // Insert open event
    await svc.from("email_open_events").insert({
      record_id: rid,
      ip_address:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        null,
      user_agent: req.headers.get("user-agent") ?? null,
    });

    // Increment open count; set opened_at only on first open
    const { data: rec } = await svc
      .from("email_send_records")
      .select("open_count, opened_at")
      .eq("id", rid)
      .single();

    if (rec) {
      await svc
        .from("email_send_records")
        .update({
          open_count: (rec.open_count ?? 0) + 1,
          opened_at: rec.opened_at ?? now,
          last_opened_at: now,
        })
        .eq("id", rid);
    }
  } catch {
    // Never fail — always return the pixel
  }

  return gifResponse();
}
