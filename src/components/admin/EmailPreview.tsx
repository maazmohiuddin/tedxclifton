"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import type { Submission } from "@/lib/types";

export function EmailPreview({
  submission,
  onClose,
  onConfirm,
}: {
  submission: Submission;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  // Close on ESC, lock body scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
        className="fixed inset-0 z-[1000] bg-khi-ink-soft/85 backdrop-blur-lg p-5 md:p-10 flex items-center justify-center"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 20, scale: 0.96, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 10, scale: 0.98, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[680px] max-h-[90vh] overflow-auto rounded-3xl bg-khi-ink border border-khi-blue/30 shadow-glow-md"
          style={{ boxShadow: "0 30px 100px rgba(0,0,0,0.5), 0 0 60px rgba(235,0,40,0.15)" }}
        >
          <header className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <h2 id="email-modal-title" className="font-display text-lg font-bold tracking-tight">Approval Email Preview</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="grid place-items-center w-9 h-9 rounded-full text-white/55 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          {/* Email metadata */}
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-white/45">To: <strong className="text-white">{submission.full_name}</strong> &lt;{submission.email}&gt;</span>
              <span className="text-white/45">Subject: <strong className="text-white">You've been approved — TEDxClifton</strong></span>
            </div>
            <span className="text-[10px] text-white/30 tracking-widest hidden md:inline">PREVIEW</span>
          </div>

          {/* Email body */}
          <div className="p-6 md:p-8">
            <div className="mx-auto max-w-[600px] rounded-xl overflow-hidden bg-white text-[#0F1626] shadow-2xl">
              <div className="relative isolate overflow-hidden px-9 pt-9 pb-14 text-white" style={{ background: "#0A0204" }}>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10"
                  style={{
                    background:
                      "radial-gradient(ellipse 60% 80% at 80% 0%, rgba(235,0,40,0.5) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 20% 100%, rgba(235,0,40,0.32) 0%, transparent 60%)",
                  }}
                />
                <div className="flex items-center gap-3 mb-5">
                  <Image
                    src="/brand/Khinext1.png"
                    alt="TEDxClifton"
                    width={36}
                    height={36}
                    style={{ borderRadius: 9 }}
                  />
                  <span className="font-display text-xl font-bold tracking-tight">
                    TEDxClifton
                  </span>
                </div>
                <p className="text-[11px] uppercase font-bold text-[#FF8A9D] tracking-widest mb-3.5">TEDxClifton · Application Update</p>
                <p className="font-display text-3xl md:text-4xl font-extrabold leading-tight m-0" style={{ letterSpacing: "-0.025em" }}>
                  You've been <em className="text-[#FF1F44] font-extrabold" style={{ fontStyle: "italic" }}>approved.</em>
                </p>
              </div>

              <div className="px-9 py-9 text-[15px] leading-relaxed text-[#2A3245]">
                <p className="m-0 mb-4">Hi <strong className="text-[#0A0204]">{submission.full_name}</strong>,</p>
                <p className="m-0 mb-4">
                  Your submission to <strong className="text-[#0A0204]">TEDxClifton</strong> has been reviewed and approved by the curation team.
                </p>
                <p className="m-0 mb-4">
                  Your project, <strong className="text-[#0A0204]">"{submission.project}"</strong>, has been selected for a live demo booth at the event in Karachi.
                </p>
                <div className="my-5 rounded-xl border border-[#DEE6FA] bg-[#F4F7FE] p-5">
                  {[
                    { k: "Submission ID", v: `S-${submission.id.slice(0, 8).toUpperCase()}` },
                    { k: "Project",       v: submission.project },
                    { k: "Topic",         v: submission.category },
                    { k: "Status",        v: "✓ Approved" },
                    { k: "Event",         v: "TEDxClifton, Karachi" },
                  ].map(row => (
                    <div key={row.k} className="flex justify-between py-2 text-[13px] border-b border-dashed border-[#DEE6FA] last:border-b-0">
                      <span className="text-[#6C7894]">{row.k}</span>
                      <span className="text-[#0A0204] font-bold">{row.v}</span>
                    </div>
                  ))}
                </div>
                <p className="m-0 mb-4">
                  Our team will be in touch with next steps — booth setup, load-in times and exhibitor guidelines — at least 30 days before the event.
                </p>
                <div className="my-5">
                  <a
                    href="#"
                    onClick={e => e.preventDefault()}
                    className="inline-block bg-[#EB0028] text-white font-medium text-sm px-7 py-3.5 rounded-full no-underline"
                  >
                    View your submission →
                  </a>
                </div>
                <div className="mt-1.5 pt-4 border-t border-[#E4EAF6] text-[13px] text-[#6C7894]">
                  <p className="m-0">With excitement,<br /><strong className="text-[#0A0204]">The TEDxClifton Team</strong></p>
                  <p className="m-0 mt-1 text-[12px]">An independently organized TED event · Clifton, Karachi</p>
                </div>
              </div>

              <div className="bg-[#F4F7FE] px-9 py-5 text-center text-[12px] text-[#6C7894]">
                © 2026 TEDxClifton. An independently organized TED event.
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <footer className="px-6 py-5 border-t border-white/10 flex justify-end gap-3">
            <button type="button" className="kx-btn-outline" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="kx-btn-primary"
              onClick={async () => { await onConfirm(); }}
            >
              {submission.status === "approved" ? "Resend approval email" : "Approve & send email"}
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
