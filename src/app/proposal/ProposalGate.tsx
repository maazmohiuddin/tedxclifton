"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { InteractiveNebulaShader } from "@/components/ui/liquid-shader";

export function ProposalGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/proposal/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Server now sees the cookie; re-render swaps in the viewer.
        router.refresh();
        return; // keep the button busy through the transition
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Incorrect password. Please try again.");
      setBusy(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-black px-5 py-16">
      {/* Brand nebula backdrop */}
      <div className="absolute inset-0 -z-10 opacity-90">
        <InteractiveNebulaShader />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,0,0,0.20), rgba(0,0,0,0.88))",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border border-white/12 bg-white/[0.04] p-7 backdrop-blur-xl md:p-9"
        style={{ boxShadow: "0 30px 90px -40px rgba(0,0,0,0.9)" }}
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-khi-blue/15 ring-1 ring-khi-blue/40">
            <Lock size={18} className="text-khi-blue-soft" />
          </span>
          <div>
            <div className="font-display text-lg font-bold leading-none tracking-tight">
              TED<span className="text-khi-blue">x</span>Clifton
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/40">
              Confidential Proposal
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          Next is <span className="kx-accent">Now</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          This sponsorship proposal is password-protected. Enter the access
          password to view it.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Access password"
            autoFocus
            autoComplete="off"
            className="kx-input w-full"
            aria-label="Access password"
            aria-invalid={!!error}
          />
          {error && (
            <p className="text-sm text-khi-blue-soft" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !password}
            className="kx-btn-primary w-full justify-center"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? "Unlocking…" : "Unlock proposal"}
            {!busy && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-white/30">
          x = an independently organized TED event
        </p>
      </motion.div>
    </div>
  );
}
