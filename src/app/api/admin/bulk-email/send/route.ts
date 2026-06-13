/**
 * POST /api/admin/bulk-email/send
 * – Normal send: blue-accented invitation, CTA → /card-generator (standard cards)
 * – VIP send (includeVipToken:true): gold-accented invitation, CTA → /card-generator?t=vip&token=…
 */
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import {
  renderInvitationEmail, INVITATION_SUBJECT, VIP_INVITATION_SUBJECT, AGENDA_SUBJECT,
  VIP_CARD_BODY, type CustomInvitationParams,
} from "@/lib/email/invitation";
import { sendRawEmail, injectTrackingPixel } from "@/lib/smtp";
import { resolveMx } from "dns/promises";

export const runtime = "nodejs";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tedxclifton.vercel.app").replace(/\/$/, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MX_CACHE = new Map<string, boolean>();

async function checkMx(domain: string): Promise<boolean> {
  if (MX_CACHE.has(domain)) return MX_CACHE.get(domain)!;
  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    const valid = records.length > 0;
    MX_CACHE.set(domain, valid);
    return valid;
  } catch {
    MX_CACHE.set(domain, false);
    return false;
  }
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    emails?: unknown; subject?: unknown; includeVipToken?: unknown;
    headline?: unknown; bodyText?: unknown; ctaLabel?: unknown; ctaUrl?: unknown;
    includeAgenda?: unknown;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const emails = body.emails;
  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "emails must be a non-empty array" }, { status: 400 });
  }

  const valid: string[] = [];
  const invalid: string[] = [];
  for (const e of emails) {
    if (typeof e === "string" && EMAIL_RE.test(e.trim())) valid.push(e.trim().toLowerCase());
    else invalid.push(String(e));
  }
  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid email addresses provided", invalid }, { status: 400 });
  }

  const includeVipToken = body.includeVipToken === true;
  const includeAgenda   = body.includeAgenda === true;

  const defaultSubject = includeVipToken ? VIP_INVITATION_SUBJECT
    : includeAgenda ? AGENDA_SUBJECT
    : INVITATION_SUBJECT;
  const subject = typeof body.subject === "string" && body.subject.trim()
    ? body.subject.trim() : defaultSubject;

  const custom: CustomInvitationParams = {
    isVip: includeVipToken,
    includeAgenda,
    ...(typeof body.headline === "string" && body.headline.trim() ? { headline: body.headline.trim() } : {}),
    ...(typeof body.bodyText === "string" && body.bodyText.trim() ? { bodyText: body.bodyText.trim() } : {}),
    ...(typeof body.ctaLabel === "string" && body.ctaLabel.trim() ? { ctaLabel: body.ctaLabel.trim() } : {}),
    // For normal emails only: allow a custom CTA URL override
    ...(!includeVipToken && typeof body.ctaUrl === "string" && body.ctaUrl.trim()
      ? { ctaUrl: body.ctaUrl.trim() }
      : {}),
  };

  const svc = createServiceClient();

  const { data: log, error: logErr } = await svc
    .from("bulk_email_logs")
    .insert({
      sent_by: user.id,
      subject,
      total_count: valid.length,
      sent_count: 0,
      failed_count: 0,
      recipients: [],
      failed_recipients: [],
    })
    .select("id")
    .single();

  if (logErr || !log) {
    return NextResponse.json({ error: "Failed to create log entry" }, { status: 500 });
  }
  const logId = log.id as string;

  // For normal emails, render once (all recipients get the same HTML)
  const baseHtml   = includeVipToken ? null : renderInvitationEmail(custom);
  const plainText  = (baseHtml ?? renderInvitationEmail(custom))
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const sentList:   string[] = [];
  const failedList: { email: string; error: string }[] = [];

  for (const email of valid) {
    const domain  = email.split("@")[1];
    const mxValid = await checkMx(domain);

    const { data: rec } = await svc
      .from("email_send_records")
      .insert({ log_id: logId, email, delivery_status: "pending", mx_valid: mxValid })
      .select("id")
      .single();

    const recordId = rec?.id as string | undefined;
    const pixelUrl = recordId ? `${SITE_URL}/api/track/open?rid=${recordId}` : null;

    let html: string;

    if (includeVipToken && recordId) {
      const token     = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const tokenUrl  = `${SITE_URL}/card-generator?t=vip&token=${token}`;

      await svc.from("vip_invite_tokens").insert({
        token, email, log_id: logId, record_id: recordId, expires_at: expiresAt,
      });

      html = renderInvitationEmail({
        ...custom,
        isVip:    true,
        ctaLabel: custom.ctaLabel ?? "Create Your VIP Card",
        ctaUrl:   tokenUrl,
        bodyText: custom.bodyText ?? VIP_CARD_BODY,
      });
    } else {
      html = baseHtml!;
    }

    if (pixelUrl) html = injectTrackingPixel(html, pixelUrl);

    try {
      const result = await sendRawEmail({ to: email, subject, html, text: plainText });
      sentList.push(email);
      if (recordId) {
        await svc.from("email_send_records").update({
          delivery_status: "sent",
          smtp_message_id: result.messageId,
        }).eq("id", recordId);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      failedList.push({ email, error: errMsg });
      if (recordId) {
        await svc.from("email_send_records").update({
          delivery_status: "failed",
          smtp_error: errMsg,
        }).eq("id", recordId);
      }
    }
  }

  await svc.from("bulk_email_logs").update({
    sent_count: sentList.length,
    failed_count: failedList.length,
    recipients: sentList,
    failed_recipients: failedList,
  }).eq("id", logId);

  return NextResponse.json({
    ok: true,
    total: valid.length,
    sent: sentList.length,
    failed: failedList.length,
    sentList,
    failedList,
    ...(invalid.length > 0 ? { skippedInvalid: invalid } : {}),
  });
}
