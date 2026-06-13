"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, Search, Star as StarIcon, Pencil, Trash2,
  Check, X, ArrowUpDown,
} from "lucide-react";
import type { Testimonial, TestimonialStatus, VerificationTier } from "@/lib/types";
import { VERIFICATION_LABELS } from "@/lib/types";
import { TestimonialAvatar } from "@/components/testimonials/TestimonialAvatar";
import { VerificationBadge } from "@/components/testimonials/VerificationBadge";
import { StarRating } from "@/components/ui/StarRating";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function avatarUrl(path: string | null): string | null {
  if (!path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/testimonials/${path}`;
}

const STATUS_COLOR: Record<TestimonialStatus, { text: string; bg: string; border: string }> = {
  pending: { text: "#FFD06B", bg: "rgba(255,184,0,0.10)", border: "rgba(255,184,0,0.32)" },
  approved: { text: "#51FFD5", bg: "rgba(81,255,213,0.10)", border: "rgba(81,255,213,0.32)" },
  rejected: { text: "#FF6B8E", bg: "rgba(255,15,75,0.10)", border: "rgba(255,15,75,0.32)" },
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export interface TestimonialPatch {
  status?: TestimonialStatus;
  featured?: boolean;
  edit?: Partial<Pick<Testimonial, "full_name" | "designation" | "company" | "body" | "rating">>;
}

type StatusFilter = "all" | TestimonialStatus;
type TierFilter = "all" | VerificationTier;

export function TestimonialsTable({
  items,
  onModerate,
  onDelete,
}: {
  items: Testimonial[];
  onModerate: (id: string, patch: TestimonialPatch) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [search, setSearch] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter(t => t.status === "pending").length,
    approved: items.filter(t => t.status === "approved").length,
    rejected: items.filter(t => t.status === "rejected").length,
    vip: items.filter(t => t.verification === "vip").length,
    attendee: items.filter(t => t.verification === "attendee").length,
    community: items.filter(t => t.verification === "community").length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(t => statusFilter === "all" || t.status === statusFilter)
      .filter(t => tierFilter === "all" || t.verification === tierFilter)
      .filter(t => !q ||
        t.full_name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.company ?? "").toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q))
      .sort((a, b) => {
        const d = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return newestFirst ? d : -d;
      });
  }, [items, statusFilter, tierFilter, search, newestFirst]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mr-1">Status</span>
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <FilterChip key={f} active={statusFilter === f} onClick={() => setStatusFilter(f)} label={`${f}${f !== "all" ? ` (${counts[f]})` : ""}`} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mr-1">Verification</span>
          {(["all", "vip", "attendee", "community"] as const).map(f => (
            <FilterChip
              key={f}
              active={tierFilter === f}
              onClick={() => setTierFilter(f)}
              label={f === "all" ? "all" : `${VERIFICATION_LABELS[f]} (${counts[f]})`}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search name, email, company, text…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-full bg-white/[0.04] border border-white/10 pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-khi-blue/50 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setNewestFirst(v => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-[11px] font-semibold text-white/55 hover:text-white hover:border-khi-blue/30 transition-colors"
          >
            <ArrowUpDown size={12} />
            {newestFirst ? "Newest first" : "Oldest first"}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-white/45">
          No testimonials in this view.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
          <ul>
            {filtered.map(t => {
              const c = STATUS_COLOR[t.status];
              const isOpen = expanded === t.id;
              const isEditing = editing === t.id;
              return (
                <li key={t.id} className="border-b border-white/10 last:border-b-0">
                  {/* Row */}
                  <div
                    className="flex items-center gap-3 px-5 md:px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => { setExpanded(isOpen ? null : t.id); setEditing(null); }}
                    role="button"
                    aria-expanded={isOpen}
                  >
                    <TestimonialAvatar name={t.full_name} src={avatarUrl(t.avatar_path)} tier={t.verification} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium truncate">{t.full_name}</span>
                        {t.featured && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#FFD06B]">
                            <StarIcon size={10} fill="#FFD06B" /> Featured
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/40 truncate block">{t.email}</span>
                    </div>
                    <div className="hidden sm:block">
                      <VerificationBadge tier={t.verification} size="sm" />
                    </div>
                    <Pill text={t.status} colors={c} />
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={15} className="text-white/40" />
                    </motion.div>
                  </div>

                  {/* Detail */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="px-5 md:px-8 pb-6 pt-2 border-t border-white/[0.06] bg-white/[0.015]" onClick={e => e.stopPropagation()}>
                          {isEditing ? (
                            <EditPanel
                              testimonial={t}
                              onCancel={() => setEditing(null)}
                              onSave={async (edit) => {
                                const ok = await onModerate(t.id, { edit });
                                if (ok) setEditing(null);
                              }}
                            />
                          ) : (
                            <>
                              <div className="grid md:grid-cols-2 gap-6 mt-4">
                                <div className="flex flex-col gap-3">
                                  <Detail label="Designation" value={t.designation ?? "—"} />
                                  <Detail label="Company" value={t.company ?? "—"} />
                                  <Detail label="Verification" value={VERIFICATION_LABELS[t.verification]} />
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Rating</p>
                                    {t.rating ? <StarRating value={t.rating} size={16} /> : <span className="text-sm text-white/50">No rating</span>}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Testimonial</p>
                                  <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{t.body}</p>
                                </div>
                              </div>
                              <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap gap-x-8 gap-y-2">
                                <Detail label="Submitted" value={fmt(t.created_at)} inline />
                                {t.reviewed_at && <Detail label="Reviewed" value={fmt(t.reviewed_at)} inline />}
                              </div>

                              {/* Actions */}
                              <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
                                {t.status !== "approved" && (
                                  <button className="kx-btn-primary !px-4 !py-2 !text-xs" onClick={() => onModerate(t.id, { status: "approved" })}>
                                    <Check size={13} /> Approve
                                  </button>
                                )}
                                {t.status !== "rejected" && (
                                  <button
                                    type="button"
                                    className="rounded-full text-xs font-medium px-4 py-2 transition-colors border bg-[rgba(255,15,75,0.12)] border-[rgba(255,15,75,0.32)] text-[#FF6B8E] hover:bg-[rgba(255,15,75,0.2)] hover:text-white"
                                    onClick={() => onModerate(t.id, { status: "rejected" })}
                                  >
                                    <X size={13} className="inline -mt-0.5 mr-1" /> Reject
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={`rounded-full text-xs font-medium px-4 py-2 transition-colors border ${
                                    t.featured
                                      ? "bg-[rgba(255,184,0,0.15)] border-[rgba(255,184,0,0.4)] text-[#FFD06B]"
                                      : "border-white/15 text-white/55 hover:text-white hover:border-[rgba(255,184,0,0.4)]"
                                  }`}
                                  onClick={() => onModerate(t.id, { featured: !t.featured })}
                                >
                                  <StarIcon size={12} className="inline -mt-0.5 mr-1" fill={t.featured ? "#FFD06B" : "transparent"} />
                                  {t.featured ? "Featured" : "Feature"}
                                </button>
                                <button className="kx-btn-outline !px-4 !py-2 !text-xs" onClick={() => setEditing(t.id)}>
                                  <Pencil size={12} /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="ml-auto rounded-full text-xs font-medium px-4 py-2 transition-colors border border-white/10 text-white/40 hover:text-[#FF6B8E] hover:border-[rgba(255,15,75,0.32)]"
                                  onClick={() => {
                                    if (confirm("Delete this testimonial permanently? This cannot be undone.")) onDelete(t.id);
                                  }}
                                >
                                  <Trash2 size={12} className="inline -mt-0.5 mr-1" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function EditPanel({
  testimonial,
  onSave,
  onCancel,
}: {
  testimonial: Testimonial;
  onSave: (edit: Partial<Pick<Testimonial, "full_name" | "designation" | "company" | "body" | "rating">>) => Promise<void>;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(testimonial.full_name);
  const [designation, setDesignation] = useState(testimonial.designation ?? "");
  const [company, setCompany] = useState(testimonial.company ?? "");
  const [body, setBody] = useState(testimonial.body);
  const [rating, setRating] = useState<number | null>(testimonial.rating);
  const [saving, setSaving] = useState(false);

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="grid md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="kx-label">Full Name</span>
          <input className="kx-input" value={fullName} onChange={e => setFullName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="kx-label">Designation</span>
          <input className="kx-input" value={designation} onChange={e => setDesignation(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="kx-label">Company</span>
          <input className="kx-input" value={company} onChange={e => setCompany(e.target.value)} />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="kx-label">Testimonial</span>
        <textarea className="kx-input min-h-[110px] resize-y leading-relaxed" value={body} onChange={e => setBody(e.target.value)} maxLength={2000} />
      </label>
      <div className="flex items-center gap-3">
        <span className="kx-label">Rating</span>
        <StarRating value={rating} onChange={setRating} size={18} />
        {rating != null && (
          <button type="button" className="text-[11px] text-white/40 hover:text-white" onClick={() => setRating(null)}>clear</button>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="kx-btn-primary !px-4 !py-2 !text-xs"
          disabled={saving || !fullName.trim() || body.trim().length < 5}
          onClick={async () => {
            setSaving(true);
            await onSave({ full_name: fullName, designation, company, body, rating });
            setSaving(false);
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="kx-btn-outline !px-4 !py-2 !text-xs" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-colors duration-200 ${
        active
          ? "bg-khi-blue/15 border border-khi-blue/55 text-khi-blue-soft"
          : "bg-transparent border border-white/10 text-white/45 hover:border-khi-blue/30"
      }`}
    >
      {label}
    </button>
  );
}

function Pill({ text, colors }: { text: string; colors: { text: string; bg: string; border: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs capitalize border w-fit"
      style={{ color: colors.text, background: colors.bg, borderColor: colors.border }}
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: colors.text }} />
      {text}
    </span>
  );
}

function Detail({ label, value, inline }: { label: string; value: string; inline?: boolean }) {
  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{label}:</span>
        <span className="text-xs text-white/60">{value}</span>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <p className="text-sm text-white/80">{value}</p>
    </div>
  );
}
