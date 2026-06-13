import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BulkEmailer } from "@/components/admin/BulkEmailer";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Bulk Emailer — TEDxClifton Admin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function BulkEmailPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <PageHero eyebrow="Access Denied" title={<>Not an <span className="kx-accent">admin.</span></>}>
        Signed in as <strong className="text-white">{user.email}</strong>, but this email isn't in the admins whitelist.
      </PageHero>
    );
  }

  return <BulkEmailer adminEmail={user.email ?? ""} />;
}
