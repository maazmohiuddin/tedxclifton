import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

type UpdatePayload = {
  status?: "new" | "read" | "replied";
  important?: boolean;
  archived?: boolean;
  deleted_at?: string | null;
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as UpdatePayload;
  const patch: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!["new", "read", "replied"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (body.important !== undefined) patch.important = body.important;
  if (body.archived !== undefined)  patch.archived  = body.archived;
  if ("deleted_at" in body)         patch.deleted_at = body.deleted_at;

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  await createServiceClient()
    .from("contact_messages")
    .update(patch)
    .eq("id", params.id);

  return NextResponse.json({ ok: true });
}
