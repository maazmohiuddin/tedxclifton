import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import { RegistrationDetail } from "./RegistrationDetail";
import type { InviteInfo, Registration } from "@/lib/types";

export const metadata: Metadata = {
  title: "Registration · Admin — TEDxClifton",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function RegistrationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("id", params.id)
    .single<Registration>();

  if (error || !data) notFound();

  // Fetch all invitation sends for this email to show in the audit trail.
  const svc = createServiceClient();
  const { data: inviteRows } = await svc
    .from("email_send_records")
    .select("sent_at, open_count")
    .eq("email", data.email.toLowerCase())
    .eq("delivery_status", "sent")
    .order("sent_at", { ascending: false });

  let inviteInfo: InviteInfo | null = null;
  if (inviteRows && inviteRows.length > 0) {
    inviteInfo = {
      last_sent_at: inviteRows[0].sent_at as string,
      times_sent: inviteRows.length,
      open_count: (inviteRows as { open_count: number | null }[]).reduce((s, r) => s + (r.open_count ?? 0), 0),
    };
  }

  return <RegistrationDetail initial={data} inviteInfo={inviteInfo} />;
}
