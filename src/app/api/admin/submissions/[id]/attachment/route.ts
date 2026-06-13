import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: isAdmin } = await auth.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = createServiceClient();
  const { data: sub, error } = await svc
    .from("submissions")
    .select("file_path")
    .eq("id", params.id)
    .single();

  if (error || !sub?.file_path) {
    return NextResponse.json({ error: "No attachment found." }, { status: 404 });
  }

  const { data: signed, error: signErr } = await svc.storage
    .from("submissions")
    .createSignedUrl(sub.file_path, 60 * 10); // 10-minute signed URL

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: signErr?.message ?? "Could not generate URL." }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
