"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, CheckCircle2, Clock, Phone, Building2,
  User, Send, Hash, Calendar, MailCheck,
} from "lucide-react";
import type { InviteInfo, Registration } from "@/lib/types";
import { TRACK_LABELS } from "@/lib/types";
import { Toast } from "@/components/admin/Toast";
import { LiveBadge, type LiveStatus } from "@/components/admin/LiveBadge";
import { createClient } from "@/lib/supabase/client";

export function RegistrationDetail({ initial, inviteInfo }: { initial: Registration; inviteInfo: InviteInfo | null }) {
  const [registration, setRegistration] = useState<Registration>(initial);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("connecting");

  // ── Realtime: subscribe to UPDATE/DELETE on THIS registration row only ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`registration-${initial.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "registrations", filter: `id=eq.${initial.id}` },
        payload => setRegistration(payload.new as Registration),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "registrations", filter: `id=eq.${initial.id}` },
        () => {
          setError("This registration was deleted by another admin.");
          setLiveStatus("down");
        },
      )
      .subscribe(status => {
        if (status === "SUBSCRIBED") setLiveStatus("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setLiveStatus("down");
      });
    return () => { supabase.removeChannel(channel); };
  }, [initial.id]);

  const confirmed = !!registration.confirmed_at;
  const hasSent = (registration.confirmation_email_count ?? 0) > 0;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  }

  async function sendEmail() {
    setSending(true);
    setError(null);
    setConfirmOpen(false);
    try {
      const res = await fetch(`/api/admin/registrations/${registration.id}/send-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Send failed");
      setRegistration(json.registration as Registration);
      showToast(hasSent ? "Confirmation email re-sent ✓" : "Slot confirmed · email sent ✓");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Send failed.";
      setError(msg);
      showToast(`Failed: ${msg}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-page mx-auto px-6 md:px-14 py-10 md:py-14">
      {/* Breadcrumb + live indicator */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to dashboard
        </Link>
        <LiveBadge status={liveStatus} />
      </div>

      {/* Header card */}
      <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="kx-eyebrow mb-3">Registration · {confirmed ? "Confirmed" : "Awaiting confirmation"}</p>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white -tracking-tight break-words">
              {registration.full_name}
            </h1>
            <p className="mt-2 text-white/55">
              <a href={`mailto:${registration.email}`} className="hover:text-white transition-colors">
                {registration.email}
              </a>
            </p>
          </div>
          <StatusPill confirmed={confirmed} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="kx-btn-primary"
            disabled={sending}
            onClick={() => setConfirmOpen(true)}
          >
            <Send size={15} aria-hidden="true" />
            {sending
              ? "Sending…"
              : hasSent
                ? "Resend confirmation email"
                : "Confirm slot & send email"}
          </button>
          <a
            href={`mailto:${registration.email}?subject=${encodeURIComponent("TEDxClifton — your registration")}`}
            className="kx-btn-outline"
          >
            <Mail size={15} aria-hidden="true" />
            Reply in mail client
          </a>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#FF6B8E]">{error}</p>
        )}
      </header>

      {/* Detail grid */}
      <section
        aria-label="Registration details"
        className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <h2 className="font-display text-lg font-bold text-white -tracking-tight mb-5">
            Submitted information
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <DetailRow icon={<User size={14} />} label="Full name" value={registration.full_name} />
            <DetailRow icon={<Mail size={14} />} label="Email" value={registration.email} mono />
            <DetailRow icon={<Phone size={14} />} label="Phone" value={registration.phone ?? "—"} />
            <DetailRow icon={<Building2 size={14} />} label="Organisation" value={registration.organisation ?? "—"} />
            <DetailRow icon={<User size={14} />} label="Role" value={registration.role} />
            <DetailRow icon={<Hash size={14} />} label="Track" value={TRACK_LABELS[registration.track]} />
            <DetailRow
              icon={<Hash size={14} />}
              label="Referral source"
              value={registration.referral ?? "—"}
              className="sm:col-span-2"
            />
          </dl>
        </div>

        {/* Audit / status sidebar */}
        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
          <h2 className="font-display text-lg font-bold text-white -tracking-tight mb-5">Audit trail</h2>
          <ul className="flex flex-col gap-4 text-sm">
            <Audit
              icon={<Calendar size={14} />}
              label="Registered at"
              value={formatDateTime(registration.created_at)}
            />
            <Audit
              icon={confirmed ? <CheckCircle2 size={14} /> : <Clock size={14} />}
              label="Slot confirmed"
              value={confirmed ? formatDateTime(registration.confirmed_at) : "Not yet confirmed"}
              accent={confirmed ? "good" : "muted"}
            />
            <Audit
              icon={<Mail size={14} />}
              label="Email sent"
              value={
                registration.confirmation_email_sent_at
                  ? formatDateTime(registration.confirmation_email_sent_at)
                  : "—"
              }
            />
            <Audit
              icon={<Hash size={14} />}
              label="Sent count"
              value={String(registration.confirmation_email_count ?? 0)}
            />
            <Audit
              icon={<MailCheck size={14} />}
              label="Invitation sent"
              value={
                inviteInfo
                  ? `${inviteInfo.times_sent}× · last ${formatDateTime(inviteInfo.last_sent_at)}${inviteInfo.open_count > 0 ? ` · opened ${inviteInfo.open_count}×` : ""}`
                  : "Not sent via mailer"
              }
              accent={inviteInfo ? "good" : "muted"}
            />
            <Audit
              icon={<Hash size={14} />}
              label="Registration ID"
              value={`R-${registration.id.slice(0, 8).toUpperCase()}`}
              mono
            />
          </ul>
        </aside>
      </section>

      {/* Confirmation modal */}
      {confirmOpen && (
        <ConfirmDialog
          title={hasSent ? "Resend confirmation email?" : "Confirm slot & send email?"}
          body={
            hasSent
              ? <>This will re-send the branded confirmation email to <strong className="text-white">{registration.email}</strong>. The slot is already marked as confirmed.</>
              : <>This will mark the slot as confirmed and email <strong className="text-white">{registration.email}</strong> their branded confirmation. You can resend later if needed.</>
          }
          confirmLabel={hasSent ? "Resend email" : "Confirm & send"}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={sendEmail}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

/* ── tiny presentational helpers ─────────────────────────────── */

function StatusPill({ confirmed }: { confirmed: boolean }) {
  const color = confirmed
    ? { text: "#51FFD5", bg: "rgba(81,255,213,0.10)", border: "rgba(81,255,213,0.32)" }
    : { text: "#FFD06B", bg: "rgba(255,184,0,0.10)", border: "rgba(255,184,0,0.32)" };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border"
      style={{ color: color.text, background: color.bg, borderColor: color.border }}
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: color.text }} />
      {confirmed ? "Confirmed" : "Pending confirmation"}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
  className,
}: { icon: React.ReactNode; label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-2 text-[11px] font-bold uppercase text-white/30 mb-1.5" style={{ letterSpacing: "0.16em" }}>
        <span className="text-khi-blue" aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className={`text-white text-[15px] break-words ${mono ? "font-mono text-sm" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function Audit({
  icon,
  label,
  value,
  accent = "default",
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "default" | "good" | "muted";
  mono?: boolean;
}) {
  const accentColor = accent === "good" ? "#51FFD5" : accent === "muted" ? "rgba(255,255,255,0.30)" : "var(--khi-blue)";
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1" style={{ color: accentColor }} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase text-white/30" style={{ letterSpacing: "0.16em" }}>{label}</div>
        <div className={`mt-1 text-white/85 ${mono ? "font-mono text-xs" : "text-sm"}`}>{value}</div>
      </div>
    </li>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[1000] bg-khi-ink-soft/85 backdrop-blur-lg p-5 grid place-items-center"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-[480px] rounded-3xl bg-khi-ink border border-khi-blue/30 p-7" style={{ boxShadow: "0 30px 100px rgba(0,0,0,0.5), 0 0 60px rgba(49,107,255,0.15)" }}>
        <h3 id="confirm-title" className="font-display text-xl font-bold text-white -tracking-tight">{title}</h3>
        <p className="mt-3 text-white/70 leading-relaxed text-sm">{body}</p>
        <div className="mt-6 flex gap-3 justify-end flex-wrap">
          <button type="button" className="kx-btn-outline" onClick={onCancel}>Cancel</button>
          <button type="button" className="kx-btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
