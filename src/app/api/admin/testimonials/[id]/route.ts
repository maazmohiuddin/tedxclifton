import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import type { Testimonial, TestimonialStatus } from "@/lib/types";

export const runtime = "nodejs";

async function requireAdmin() {
  const auth = createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: isAdmin } = await auth.rpc("is_admin");
  if (!isAdmin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

/**
 * PATCH — moderate a testimonial.
 * Body may include any of:
 *   status: "approved" | "rejected" | "pending"
 *   featured: boolean
 *   edit: { full_name?, designation?, company?, body?, rating? }
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let body: {
    status?: TestimonialStatus;
    featured?: boolean;
    edit?: Partial<Pick<Testimonial, "full_name" | "designation" | "company" | "body" | "rating">>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.status) {
    if (!["approved", "rejected", "pending"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    update.status = body.status;
    update.reviewed_at = new Date().toISOString();
    update.reviewed_by = gate.user.id;
  }

  if (typeof body.featured === "boolean") {
    update.featured = body.featured;
  }

  if (body.edit) {
    const e = body.edit;
    if (typeof e.full_name === "string") update.full_name = e.full_name.trim().slice(0, 120);
    if (typeof e.designation === "string") update.designation = e.designation.trim().slice(0, 160) || null;
    if (typeof e.company === "string") update.company = e.company.trim().slice(0, 160) || null;
    if (typeof e.body === "string") update.body = e.body.trim().slice(0, 2000);
    if (e.rating === null) update.rating = null;
    else if (typeof e.rating === "number" && e.rating >= 1 && e.rating <= 5) update.rating = Math.round(e.rating);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("testimonials")
    .update(update)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, testimonial: data });
}

/** DELETE — remove a testimonial (and its avatar) permanently. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const svc = createServiceClient();

  // Best-effort avatar cleanup.
  const { data: row } = await svc
    .from("testimonials")
    .select("avatar_path")
    .eq("id", params.id)
    .single();

  if (row?.avatar_path) {
    await svc.storage.from("testimonials").remove([row.avatar_path]).catch(() => {});
  }

  const { error } = await svc.from("testimonials").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
