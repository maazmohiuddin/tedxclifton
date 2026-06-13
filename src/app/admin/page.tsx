import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { PageHero } from "@/components/ui/PageHero";
import type { CardShare, ContactMessage, InviteInfo, Registration, Submission, Testimonial } from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin Dashboard — TEDxClifton",
  robots: { index: false },
};

// Always render fresh data on every request — never cache.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Verify the user is in the admins whitelist (defense-in-depth on top of RLS).
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <>
        <PageHero eyebrow="Access Denied" title={<>Not an <span className="kx-accent">admin.</span></>}>
          Signed in as <strong className="text-white">{user.email}</strong>, but this email isn't in the admins whitelist.
          Have an existing admin add it via Supabase Studio.
        </PageHero>
        <section className="kx-section">
          <form action="/api/admin/signout" method="post" className="text-center">
            <button className="kx-btn-outline" type="submit">Sign out</button>
          </form>
        </section>
      </>
    );
  }

  const svc = createServiceClient();
  const [subsRes, regsRes, cardsRes, msgsRes, testiRes, inviteRes] = await Promise.all([
    supabase.from("submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("registrations").select("*").order("created_at", { ascending: false }),
    svc.from("card_shares").select("id, slug, name, template, designation, created_at").order("created_at", { ascending: false }),
    svc.from("contact_messages").select("*").order("created_at", { ascending: false }),
    svc.from("testimonials").select("*").order("created_at", { ascending: false }),
    svc.from("email_send_records").select("email, sent_at, open_count").eq("delivery_status", "sent").order("sent_at", { ascending: false }),
  ]);

  const submissions = (subsRes.data ?? []) as Submission[];
  const registrations = (regsRes.data ?? []) as Registration[];
  const cardShares = (cardsRes.data ?? []) as CardShare[];
  const messages = (msgsRes.data ?? []) as ContactMessage[];
  const testimonials = (testiRes.data ?? []) as Testimonial[];

  // Build email → InviteInfo map (most recent send + totals)
  const invitedEmails: Record<string, InviteInfo> = {};
  for (const rec of (inviteRes.data ?? []) as { email: string; sent_at: string; open_count: number | null }[]) {
    const key = rec.email.toLowerCase();
    if (!invitedEmails[key]) {
      invitedEmails[key] = { last_sent_at: rec.sent_at, times_sent: 1, open_count: rec.open_count ?? 0 };
    } else {
      invitedEmails[key].times_sent++;
      invitedEmails[key].open_count = Math.max(invitedEmails[key].open_count, rec.open_count ?? 0);
    }
  }

  return (
    <AdminDashboard
      adminEmail={user.email ?? ""}
      initialSubmissions={submissions}
      initialRegistrations={registrations}
      initialCardShares={cardShares}
      initialMessages={messages}
      initialTestimonials={testimonials}
      invitedEmails={invitedEmails}
    />
  );
}
