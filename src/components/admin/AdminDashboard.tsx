"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, Mail, Inbox, MessageSquareQuote } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { CardShare, ContactMessage, InviteInfo, Registration, Submission, SubmissionStatus, Testimonial } from "@/lib/types";
import { SubmissionsTable } from "./SubmissionsTable";
import { RegistrationsTable } from "./RegistrationsTable";
import { CardSharesTable } from "./CardSharesTable";
import { AdminInbox } from "./AdminInbox";
import { TestimonialsTable, type TestimonialPatch } from "./TestimonialsTable";
import { Toast } from "./Toast";
import { LiveBadge, type LiveStatus } from "./LiveBadge";

type Tab = "submissions" | "registrations" | "cards" | "inbox" | "testimonials";

export function AdminDashboard({
  adminEmail,
  initialSubmissions,
  initialRegistrations,
  initialCardShares,
  initialMessages,
  initialTestimonials,
  invitedEmails,
}: {
  adminEmail: string;
  initialSubmissions: Submission[];
  initialRegistrations: Registration[];
  initialCardShares: CardShare[];
  initialMessages: ContactMessage[];
  initialTestimonials: Testimonial[];
  invitedEmails: Record<string, InviteInfo>;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations);
  const [cardShares, setCardShares] = useState<CardShare[]>(initialCardShares);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [unreadCount, setUnreadCount] = useState(() => initialMessages.filter(m => m.status === "new").length);
  const [tab, setTab] = useState<Tab>("submissions");
  const [filter, setFilter] = useState<"all" | SubmissionStatus>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("connecting");

  // First mount: don't toast for the initial state — only for events that arrive AFTER subscription.
  const subscribedRef = useRef(false);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }

  // ── Realtime subscriptions ───────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, payload => {
        setSubmissions(curr => {
          if (payload.eventType === "INSERT") {
            const next = payload.new as Submission;
            if (subscribedRef.current) showToast(`New submission · ${next.full_name ?? "Anonymous"}`);
            return [next, ...curr];
          }
          if (payload.eventType === "UPDATE") return curr.map(s => s.id === (payload.new as Submission).id ? (payload.new as Submission) : s);
          if (payload.eventType === "DELETE") return curr.filter(s => s.id !== (payload.old as Submission).id);
          return curr;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, payload => {
        setRegistrations(curr => {
          if (payload.eventType === "INSERT") {
            const next = payload.new as Registration;
            if (subscribedRef.current) showToast(`New registration · ${next.full_name}`);
            return [next, ...curr];
          }
          if (payload.eventType === "UPDATE") return curr.map(r => r.id === (payload.new as Registration).id ? (payload.new as Registration) : r);
          if (payload.eventType === "DELETE") return curr.filter(r => r.id !== (payload.old as Registration).id);
          return curr;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "card_shares" }, payload => {
        setCardShares(curr => {
          if (payload.eventType === "INSERT") {
            const next = payload.new as CardShare;
            if (subscribedRef.current) showToast(`New card generated · ${next.name ?? "Anonymous"}`);
            return [next, ...curr];
          }
          if (payload.eventType === "DELETE") return curr.filter(c => c.id !== (payload.old as CardShare).id);
          return curr;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "testimonials" }, payload => {
        setTestimonials(curr => {
          if (payload.eventType === "INSERT") {
            const next = payload.new as Testimonial;
            if (subscribedRef.current) showToast(`New testimonial · ${next.full_name}`);
            return [next, ...curr];
          }
          if (payload.eventType === "UPDATE") return curr.map(t => t.id === (payload.new as Testimonial).id ? (payload.new as Testimonial) : t);
          if (payload.eventType === "DELETE") return curr.filter(t => t.id !== (payload.old as Testimonial).id);
          return curr;
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, payload => {
        const msg = payload.new as ContactMessage;
        if (subscribedRef.current) {
          showToast(`New message · ${msg.name}`);
          setUnreadCount(n => n + 1);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contact_messages" }, payload => {
        const upd = payload.new as ContactMessage;
        if (upd.status !== "new") setUnreadCount(n => Math.max(0, n - 1));
      })
      .subscribe(status => {
        if (status === "SUBSCRIBED") {
          subscribedRef.current = true;
          setLiveStatus("live");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLiveStatus("down");
        } else if (status === "CLOSED") {
          setLiveStatus("down");
        }
      });

    // Tab visibility: reset state hint when user comes back to the tab,
    // so they see the live indicator update if the socket dropped while hidden.
    const onVisible = () => {
      if (document.visibilityState === "visible" && channel.state !== "joined") {
        setLiveStatus("connecting");
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => ({
    all: submissions.length,
    pending:  submissions.filter(s => s.status === "pending").length,
    approved: submissions.filter(s => s.status === "approved").length,
    rejected: submissions.filter(s => s.status === "rejected").length,
  }), [submissions]);

  const filteredSubs = useMemo(
    () => filter === "all" ? submissions : submissions.filter(s => s.status === filter),
    [submissions, filter]
  );

  async function decide(submissionId: string, decision: "approved" | "rejected") {
    const res = await fetch(`/api/admin/submissions/${submissionId}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
      showToast(`Failed: ${error}`);
      return;
    }
    showToast(decision === "approved" ? "Submission approved ✓" : "Submission rejected.");
  }

  const pendingTestimonials = useMemo(() => testimonials.filter(t => t.status === "pending").length, [testimonials]);

  async function moderateTestimonial(id: string, patch: TestimonialPatch): Promise<boolean> {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
      showToast(`Failed: ${error}`);
      return false;
    }
    const { testimonial } = await res.json();
    setTestimonials(curr => curr.map(t => t.id === id ? (testimonial as Testimonial) : t));
    if (patch.status) showToast(patch.status === "approved" ? "Testimonial approved ✓" : patch.status === "rejected" ? "Testimonial rejected." : "Testimonial updated.");
    else if (typeof patch.featured === "boolean") showToast(patch.featured ? "Featured ✓" : "Removed from featured.");
    else showToast("Testimonial updated ✓");
    return true;
  }

  async function deleteTestimonial(id: string) {
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
      showToast(`Failed: ${error}`);
      return;
    }
    setTestimonials(curr => curr.filter(t => t.id !== id));
    showToast("Testimonial deleted.");
  }

  return (
    <div className="max-w-page mx-auto px-6 md:px-14 py-12 md:py-16">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <p className="kx-eyebrow mb-3">Admin Dashboard</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white -tracking-tight">
            <span className="kx-accent">TEDxClifton</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <LiveBadge status={liveStatus} />
          <span className="text-xs text-white/45">
            Signed in as <strong className="text-white">{adminEmail}</strong>
          </span>
          <Link
            href="/admin/bulk-email"
            className="kx-btn kx-btn-primary !py-2 !px-4 !text-xs"
          >
            <Mail size={14} aria-hidden="true" />
            Invitation Mailer
          </Link>
          <form action="/api/admin/signout" method="post">
            <button className="kx-btn-outline !py-2 !px-4 !text-xs" type="submit">
              <LogOut size={14} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Total Submissions", val: submissions.length,   color: "#316BFF" },
          { label: "Pending Review",    val: counts.pending,        color: "#FFD06B" },
          { label: "Approved",          val: counts.approved,       color: "#51FFD5" },
          { label: "Registrations",     val: registrations.length,  color: "rgba(255,255,255,0.7)" },
          { label: "Cards Generated",   val: cardShares.length,     color: "#BF00FF" },
          { label: "Testimonials Pending", val: pendingTestimonials, color: "#FFD06B" },
        ].map(c => (
          <div key={c.label} className="kx-card !p-5">
            <div className="font-display text-3xl md:text-4xl font-extrabold leading-none -tracking-tight" style={{ color: c.color }}>
              {c.val}
            </div>
            <div className="mt-2 text-[11px] md:text-xs text-white/45">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div role="tablist" aria-label="Dashboard sections" className="inline-flex gap-1 rounded-full bg-white/[0.04] border border-white/10 p-1">
          {(["submissions", "registrations", "cards", "testimonials", "inbox"] as const).map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2 rounded-full text-xs font-medium transition-colors duration-200 ease-soft ${
                tab === t ? "bg-khi-blue text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t === "submissions"
                ? `Submissions (${submissions.length})`
                : t === "registrations"
                ? `Registrations (${registrations.length})`
                : t === "cards"
                ? `Cards (${cardShares.length})`
                : t === "testimonials"
                ? (
                  <span className="flex items-center gap-1.5">
                    <MessageSquareQuote size={11} />
                    Testimonials
                    {pendingTestimonials > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-[#FFD06B] text-khi-ink"
                      >
                        {pendingTestimonials}
                      </motion.span>
                    )}
                  </span>
                )
                : (
                  <span className="flex items-center gap-1.5">
                    <Inbox size={11} />
                    Inbox
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-khi-blue-bright text-white"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </span>
                )}
            </button>
          ))}
        </div>

        {tab === "submissions" && (
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Filter by status">
            {(["all", "pending", "approved", "rejected"] as const).map(f => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-colors duration-200 ease-soft ${
                    active
                      ? "bg-khi-blue/15 border border-khi-blue/55 text-khi-blue-soft"
                      : "bg-transparent border border-white/10 text-white/45 hover:border-khi-blue/30"
                  }`}
                >
                  {f} {f !== "all" && `(${counts[f as keyof typeof counts]})`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tables / Inbox */}
      {tab === "submissions" ? (
        <SubmissionsTable items={filteredSubs} onDecide={decide} />
      ) : tab === "registrations" ? (
        <RegistrationsTable items={registrations} invitedEmails={invitedEmails} />
      ) : tab === "cards" ? (
        <CardSharesTable items={cardShares} />
      ) : tab === "testimonials" ? (
        <TestimonialsTable items={testimonials} onModerate={moderateTestimonial} onDelete={deleteTestimonial} />
      ) : (
        <AdminInbox initialMessages={initialMessages} />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
