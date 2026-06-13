"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/Field";

type Method = "password" | "magic";
type PwdMode = "signin" | "signup";

export function LoginForm() {
  const params = useSearchParams();
  const nextParam = params.get("next") ?? "/admin";
  const errFromUrl = params.get("error");

  const [method, setMethod] = useState<Method>("password");

  // Hard navigation — guarantees the browser includes the freshly-set
  // Supabase auth cookies in the request to `/admin`, so the server-side
  // `getUser()` actually sees the session. router.push() is a soft
  // navigation that can miss the new cookies and bounce back to login.
  const goToNext = () => {
    if (typeof window !== "undefined") window.location.assign(nextParam);
  };

  return (
    <div className="mx-auto max-w-[460px]">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Sign-in method"
        className="mb-4 inline-flex w-full rounded-full bg-white/[0.04] border border-white/10 p-1"
      >
        <TabBtn active={method === "password"} onClick={() => setMethod("password")}>
          <Lock size={13} aria-hidden="true" /> Password
        </TabBtn>
        <TabBtn active={method === "magic"} onClick={() => setMethod("magic")}>
          <Mail size={13} aria-hidden="true" /> Magic link
        </TabBtn>
      </div>

      {/* Panel */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:p-10">
        {method === "password" ? (
          <PasswordPanel initialError={errFromUrl} onSuccess={goToNext} />
        ) : (
          <MagicLinkPanel initialError={errFromUrl} nextParam={nextParam} />
        )}
      </div>

      <p className="mt-6 text-center text-[11px] text-white/30">
        Your email must exist in the <code className="font-mono">admins</code> table to access the dashboard.
      </p>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 ease-soft ${
        active ? "bg-khi-blue text-white" : "text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────────────────────────── Password ────────── */

function PasswordPanel({
  initialError,
  onSuccess,
}: {
  initialError: string | null;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<PwdMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        onSuccess();
      } else {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { emailRedirectTo: `${origin}/auth/callback` },
        });
        if (error) throw error;
        // If Supabase project has "Confirm email" enabled, session is null until verified.
        if (data.user && !data.session) {
          setInfo("Account created. Check your inbox to confirm your email, then sign in.");
        } else {
          // Auto-confirmed: signed in already.
          onSuccess();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="text-center mb-1">
        <h3 className="font-display text-2xl font-extrabold text-white">
          {mode === "signin" ? "Sign in" : "Create admin account"}
        </h3>
        <p className="mt-2 text-sm text-white/55">
          {mode === "signin"
            ? "Sign in with your admin email and password."
            : "Set a password to use for future sign-ins."}
        </p>
      </div>

      <Field label="Email" htmlFor="pwd-email" required>
        <Input
          id="pwd-email"
          type="email"
          autoComplete="email"
          required
          placeholder="hello@tedxclifton.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="pwd"
        required
        hint={mode === "signup" ? "At least 8 characters." : undefined}
      >
        <div className="relative">
          <Input
            id="pwd"
            type={showPwd ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={mode === "signup" ? 8 : undefined}
            required
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPwd(s => !s)}
            aria-label={showPwd ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-full text-white/45 hover:text-white"
          >
            {showPwd ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
      </Field>

      {error && <p role="alert" className="text-sm text-[#FF6B8E]">{error}</p>}
      {info && (
        <p role="status" className="rounded-xl bg-khi-blue/10 border border-khi-blue/30 text-khi-blue-soft text-sm px-4 py-3">
          {info}
        </p>
      )}

      <button
        type="submit"
        className="kx-btn-primary w-full justify-center !py-3.5"
        disabled={busy || !email || !password}
      >
        {busy ? (mode === "signin" ? "Signing in…" : "Creating…") : mode === "signin" ? "Sign in" : "Create account"}
        {!busy && <ArrowRight size={16} aria-hidden="true" />}
      </button>

      <button
        type="button"
        onClick={() => { setMode(m => (m === "signin" ? "signup" : "signin")); setError(null); setInfo(null); }}
        className="text-center text-xs text-white/55 hover:text-white transition-colors"
      >
        {mode === "signin" ? "First time? Create an admin account →" : "← Have an account? Sign in"}
      </button>
    </form>
  );
}

/* ───────────────────────────────────────────────── Magic link ──────── */

function MagicLinkPanel({
  initialError,
  nextParam,
}: {
  initialError: string | null;
  nextParam: string;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError(null);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextParam)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });
    setSending(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" aria-live="polite" className="text-center">
        <div
          className="mx-auto mb-5 grid place-items-center w-14 h-14 rounded-full bg-khi-blue/15 border border-khi-blue/30 text-khi-blue-bright"
          style={{ boxShadow: "0 0 32px rgba(49,107,255,0.32)" }}
        >
          <Mail size={22} aria-hidden="true" />
        </div>
        <h3 className="font-display text-2xl font-extrabold text-white">
          Check your <span className="kx-accent">email.</span>
        </h3>
        <p className="mt-3 text-white/70">
          We sent a magic link to <strong className="text-white">{email}</strong>. Valid for 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="text-center mb-1">
        <h3 className="font-display text-2xl font-extrabold text-white">Magic link</h3>
        <p className="mt-2 text-sm text-white/55">No password needed — we'll email you a one-time sign-in link.</p>
      </div>
      <Field label="Admin email" htmlFor="magic-email" required>
        <Input
          id="magic-email"
          type="email"
          autoComplete="email"
          required
          placeholder="hello@tedxclifton.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </Field>
      {error && <p role="alert" className="text-sm text-[#FF6B8E]">{error}</p>}
      <button
        type="submit"
        className="kx-btn-primary w-full justify-center !py-3.5"
        disabled={sending || !email}
      >
        {sending ? "Sending link…" : "Send magic link"}
      </button>
    </form>
  );
}
