/**
 * Testimonial server helpers — attendee verification + public mapping.
 * Server-only: uses the service-role client to read the attendee database.
 */

import { createServiceClient } from "@/lib/supabase/server";
import type { PublicTestimonial, Testimonial, VerificationTier } from "@/lib/types";

const AVATAR_BUCKET = "testimonials";

/**
 * Determine an attendee's verification tier from the official event data.
 *
 *   vip       — registered with the `vip` or `partner` track
 *   attendee  — registered (any other track) OR sent a delivered invitation
 *   community — no record found (unverified contributor)
 */
export async function resolveVerification(email: string): Promise<VerificationTier> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return "community";

  const svc = createServiceClient();

  // 1. Registered participants — also gives us the track (VIP signal).
  const { data: reg } = await svc
    .from("registrations")
    .select("track")
    .ilike("email", normalized)
    .limit(1)
    .maybeSingle();

  if (reg) {
    return reg.track === "vip" || reg.track === "partner" ? "vip" : "attendee";
  }

  // 2. Invited participants — a successfully delivered invitation counts.
  const { data: invited } = await svc
    .from("email_send_records")
    .select("id")
    .ilike("email", normalized)
    .eq("delivery_status", "sent")
    .limit(1)
    .maybeSingle();

  if (invited) return "attendee";

  return "community";
}

/** Resolve a public CDN URL for an avatar stored in the public bucket. */
export function avatarPublicUrl(path: string | null): string | null {
  if (!path) return null;
  const svc = createServiceClient();
  return svc.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Strip PII and resolve the avatar URL for public display. */
export function toPublicTestimonial(t: Testimonial): PublicTestimonial {
  return {
    id: t.id,
    full_name: t.full_name,
    designation: t.designation,
    company: t.company,
    body: t.body,
    rating: t.rating,
    avatar_url: avatarPublicUrl(t.avatar_path),
    verification: t.verification,
    featured: t.featured,
    created_at: t.created_at,
  };
}

/**
 * Fetch approved testimonials for the public showcase, featured first.
 * Returns an empty array on any error so pages render gracefully.
 */
export async function getApprovedTestimonials(limit = 60): Promise<PublicTestimonial[]> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("testimonials")
    .select("*")
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(toPublicTestimonial);
}
