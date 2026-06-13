import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import { sendSubmissionDecision } from "@/lib/email";
import type { Submission } from "@/lib/types";

interface DecideBody {
  decision: "approved" | "rejected";
  note?: string;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: isAdmin } = await auth.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not an admin." }, { status: 403 });

  let body: DecideBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  const svc = createServiceClient();

  // Fetch submission to get submitter email + project name
  const { data: sub, error: fetchErr } = await svc
    .from("submissions")
    .select("*")
    .eq("id", params.id)
    .single<Submission>();

  if (fetchErr || !sub) {
    return NextResponse.json({ error: fetchErr?.message ?? "Submission not found." }, { status: 404 });
  }

  const { data: updated, error } = await svc
    .from("submissions")
    .update({
      status: body.decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_note: body.note ?? null,
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Update failed." }, { status: 500 });
  }

  // Send decision email via SMTP
  try {
    await sendSubmissionDecision({
      to: sub.email,
      fullName: sub.full_name,
      projectName: sub.project,
      decision: body.decision,
      note: body.note ?? null,
    });
  } catch {
    // Non-fatal: DB is updated; log but don't fail the request
    console.error(`Decision email failed for submission ${params.id}`);
  }

  return NextResponse.json({ ok: true, submission: updated });
}
