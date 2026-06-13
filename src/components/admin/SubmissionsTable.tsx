"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FileText, ExternalLink } from "lucide-react";
import type { Submission } from "@/lib/types";
import { EmailPreview } from "./EmailPreview";

const STATUS_COLOR: Record<Submission["status"], { text: string; bg: string; border: string }> = {
  pending:  { text: "#FFD06B", bg: "rgba(255,184,0,0.10)",  border: "rgba(255,184,0,0.32)" },
  approved: { text: "#51FFD5", bg: "rgba(81,255,213,0.10)", border: "rgba(81,255,213,0.32)" },
  rejected: { text: "#FF6B8E", bg: "rgba(255,15,75,0.10)",  border: "rgba(255,15,75,0.32)" },
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SubmissionsTable({
  items,
  onDecide,
}: {
  items: Submission[];
  onDecide: (id: string, decision: "approved" | "rejected") => Promise<void>;
}) {
  const [previewing, setPreviewing] = useState<Submission | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded(prev => (prev === id ? null : id));
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-white/45">
        No submissions in this view.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
        {/* desktop header */}
        <div
          className="hidden md:grid items-center gap-4 px-6 py-3 text-[10px] font-bold uppercase text-white/30 bg-white/[0.02] border-b border-white/10"
          style={{ gridTemplateColumns: "28px 80px 1.4fr 1.8fr 130px 220px", letterSpacing: "0.18em" }}
          aria-hidden="true"
        >
          <span />
          <span>ID</span>
          <span>Applicant</span>
          <span>Project</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        <ul>
          {items.map(s => {
            const c = STATUS_COLOR[s.status];
            const isOpen = expanded === s.id;

            return (
              <li key={s.id} className="border-b border-white/10 last:border-b-0">
                {/* ── Row ── */}
                <div
                  className="grid md:items-center gap-3 md:gap-4 px-5 md:px-6 py-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggle(s.id)}
                  role="button"
                  aria-expanded={isOpen}
                  aria-controls={`sub-detail-${s.id}`}
                >
                  {/* mobile layout */}
                  <div className="md:hidden flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[11px] text-white/30">{s.id.slice(0, 8).toUpperCase()}</span>
                      <span className="font-medium text-white text-sm">{s.full_name}</span>
                      <span className="text-xs text-white/45">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill text={s.status} colors={c} />
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} className="text-white/40" />
                      </motion.div>
                    </div>
                  </div>
                  <div className="md:hidden">
                    <p className="text-white text-sm font-medium">{s.project}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-khi-blue/10 border border-khi-blue/30 px-2.5 py-0.5 text-[10px] text-khi-blue-soft">{s.category}</span>
                  </div>

                  {/* desktop layout */}
                  <div
                    className="hidden md:grid items-center gap-4"
                    style={{ gridTemplateColumns: "28px 80px 1.4fr 1.8fr 130px 220px" }}
                  >
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center">
                      <ChevronDown size={14} className="text-white/40" />
                    </motion.div>
                    <span className="font-mono text-xs text-white/45">{s.id.slice(0, 8).toUpperCase()}</span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-white font-medium truncate">{s.full_name}</span>
                      <span className="text-xs text-white/45 truncate">{s.email}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white truncate">{s.project}</p>
                      <span className="mt-1 inline-block rounded-full bg-khi-blue/10 border border-khi-blue/30 px-2.5 py-0.5 text-[10px] text-khi-blue-soft">{s.category}</span>
                    </div>
                    <Pill text={s.status} colors={c} />
                    <div className="flex justify-end gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                      {s.status === "pending" && (
                        <>
                          <button className="kx-btn-primary !px-4 !py-2 !text-xs" onClick={() => setPreviewing(s)}>Approve</button>
                          <button
                            type="button"
                            className="rounded-full text-xs font-medium px-4 py-2 transition-colors border bg-[rgba(255,15,75,0.12)] border-[rgba(255,15,75,0.32)] text-[#FF6B8E] hover:bg-[rgba(255,15,75,0.2)] hover:text-white"
                            onClick={() => onDecide(s.id, "rejected")}
                          >Reject</button>
                        </>
                      )}
                      {s.status === "approved" && (
                        <button className="kx-btn-outline !px-4 !py-2 !text-xs" onClick={() => setPreviewing(s)}>Resend email</button>
                      )}
                      {s.status === "rejected" && (
                        <button className="kx-btn-outline !px-4 !py-2 !text-xs" onClick={() => onDecide(s.id, "approved")}>Undo</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Expanded detail panel ── */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`sub-detail-${s.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="px-5 md:px-8 pb-6 pt-2 border-t border-white/[0.06] bg-white/[0.015]">
                        <div className="grid md:grid-cols-2 gap-6 mt-4">

                          {/* Left col */}
                          <div className="flex flex-col gap-4">
                            <Field label="Full Name" value={s.full_name} />
                            <Field label="Email" value={s.email} />
                            <Field label="Project Name" value={s.project} />
                            <Field label="Category" value={s.category} />
                            {s.team_size && <Field label="Team Size" value={s.team_size} />}
                          </div>

                          {/* Right col */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Description</p>
                              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{s.description}</p>
                            </div>
                            {s.file_path && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Attached File</p>
                                <a
                                  href={`/api/admin/submissions/${s.id}/attachment`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-xs text-khi-blue-soft hover:text-khi-blue-bright transition-colors"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <FileText size={13} />
                                  {s.file_path.split(".").pop()?.toUpperCase() ?? "File"} attachment
                                  <ExternalLink size={11} />
                                </a>
                              </div>
                            )}
                            {s.review_note && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Review Note</p>
                                <p className="text-sm text-white/60 leading-relaxed italic">{s.review_note}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap gap-x-8 gap-y-2">
                          <Field label="Submitted" value={fmt(s.created_at)} inline />
                          {s.reviewed_at && <Field label="Reviewed" value={fmt(s.reviewed_at)} inline />}
                        </div>

                        {/* Mobile actions */}
                        <div className="md:hidden flex gap-2 flex-wrap mt-4 pt-4 border-t border-white/[0.06]">
                          {s.status === "pending" && (
                            <>
                              <button className="kx-btn-primary !px-4 !py-2 !text-xs flex-1" onClick={() => setPreviewing(s)}>Approve</button>
                              <button
                                type="button"
                                className="flex-1 rounded-full text-xs font-medium px-4 py-2 transition-colors border bg-[rgba(255,15,75,0.12)] border-[rgba(255,15,75,0.32)] text-[#FF6B8E] hover:bg-[rgba(255,15,75,0.2)] hover:text-white"
                                onClick={() => onDecide(s.id, "rejected")}
                              >Reject</button>
                            </>
                          )}
                          {s.status === "approved" && (
                            <button className="kx-btn-outline !px-4 !py-2 !text-xs flex-1" onClick={() => setPreviewing(s)}>Resend email</button>
                          )}
                          {s.status === "rejected" && (
                            <button className="kx-btn-outline !px-4 !py-2 !text-xs flex-1" onClick={() => onDecide(s.id, "approved")}>Undo</button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>

      {previewing && (
        <EmailPreview
          submission={previewing}
          onClose={() => setPreviewing(null)}
          onConfirm={async () => {
            await onDecide(previewing.id, "approved");
            setPreviewing(null);
          }}
        />
      )}
    </>
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

function Field({ label, value, inline }: { label: string; value: string; inline?: boolean }) {
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
