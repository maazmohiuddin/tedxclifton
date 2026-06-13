import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveVerification } from "@/lib/testimonials";
import { VERIFICATION_LABELS } from "@/lib/types";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY = 2000;
const MAX_NAME = 120;

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const fullName = clean(body.fullName, MAX_NAME);
  const email = clean(body.email, 200).toLowerCase();
  const designation = clean(body.designation, 160) || null;
  const company = clean(body.company, 160) || null;
  const testimonial = clean(body.body, MAX_BODY);
  const avatarPath = clean(body.avatarPath, 400) || null;

  const ratingRaw = body.rating;
  const rating =
    typeof ratingRaw === "number" && ratingRaw >= 1 && ratingRaw <= 5
      ? Math.round(ratingRaw)
      : null;

  // ── Validation ──────────────────────────────────────────
  if (!fullName) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (testimonial.length < 10) {
    return NextResponse.json({ error: "Your feedback is a little short — tell us more about your experience." }, { status: 400 });
  }

  const svc = createServiceClient();

  // ── Prevent duplicate submissions (only block once approved) ──
  const { data: existing } = await svc
    .from("testimonials")
    .select("id, status")
    .ilike("email", email)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Your testimonial has already been published. Thank you!" },
      { status: 409 },
    );
  }

  // ── Verify against the official attendee database ──
  const verification = await resolveVerification(email);

  const { data, error } = await svc
    .from("testimonials")
    .insert({
      full_name: fullName,
      email,
      designation,
      company,
      body: testimonial,
      rating,
      avatar_path: avatarPath,
      verification,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Testimonial insert error:", error);
    return NextResponse.json({ error: "Could not submit your feedback. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    verification,
    verificationLabel: VERIFICATION_LABELS[verification],
  });
}
