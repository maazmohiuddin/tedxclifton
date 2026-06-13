"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { RegistrationTrack } from "@/lib/types";
import { TRACK_LABELS } from "@/lib/types";
import { Field, Input } from "@/components/ui/Field";
import { ChipRadio } from "@/components/ui/ChipRadio";
import { Success } from "@/components/ui/Success";

const ROLES = [
  "Student",
  "Founder / Entrepreneur",
  "Professional",
  "Creative / Artist",
  "Academic / Researcher",
  "Media / Press",
  "Other",
] as const;

const TRACK_OPTIONS = (Object.entries(TRACK_LABELS) as [RegistrationTrack, string][]).map(
  ([value, label]) => ({ value, label })
);

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  organisation: string;
  role: string;
  track: RegistrationTrack;
  referral: string;
}

export function RegisterForm() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    organisation: "",
    role: "",
    track: "general",
    referral: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; name: string; email: string; track: string } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(s => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.role) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const id = crypto.randomUUID();
    const { error } = await supabase
      .from("registrations")
      .insert({
        id,
        full_name: form.fullName,
        email: form.email.trim().toLowerCase(),
        phone: form.phone || null,
        organisation: form.organisation || null,
        role: form.role,
        track: form.track,
        referral: form.referral || null,
      });
    setSubmitting(false);
    if (error) {
      // Unique constraint violation → email already registered
      const msg = (error as { code?: string }).code === "23505"
        ? "This email is already registered for TEDxClifton."
        : (error.message ?? "Could not register. Please try again.");
      setError(msg);
      return;
    }
    setDone({ id: id.slice(0, 8).toUpperCase(), name: form.fullName, email: form.email, track: TRACK_LABELS[form.track] });
  }

  if (done) {
    return (
      <Success
        title={<>You&apos;re <span className="kx-accent">in.</span></>}
        idChip={`R-${done.id}`}
      >
        <p>
          See you in Clifton, <strong className="text-white">{done.name}</strong>. Your spot for TEDxClifton is reserved.
          We&apos;ll send confirmation and event details to <strong className="text-white">{done.email}</strong>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link href="/submit" className="kx-btn-primary">
            Apply to speak
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/" className="kx-btn-outline">Back to home</Link>
        </div>
      </Success>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-[640px] flex flex-col gap-5" noValidate>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Full Name" htmlFor="r-name" required>
          <Input
            id="r-name"
            name="name"
            type="text"
            placeholder="Ayesha Khan"
            autoComplete="name"
            required
            value={form.fullName}
            onChange={e => set("fullName", e.target.value)}
          />
        </Field>
        <Field label="Email Address" htmlFor="r-email" required>
          <Input
            id="r-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={form.email}
            onChange={e => set("email", e.target.value)}
          />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Phone (optional)" htmlFor="r-phone">
          <Input
            id="r-phone"
            type="tel"
            placeholder="+92 300 0000000"
            autoComplete="tel"
            value={form.phone}
            onChange={e => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Organisation (optional)" htmlFor="r-org">
          <Input
            id="r-org"
            type="text"
            placeholder="Company / University"
            autoComplete="organization"
            value={form.organisation}
            onChange={e => set("organisation", e.target.value)}
          />
        </Field>
      </div>
      <ChipRadio
        legend="I am a"
        name="role"
        required
        value={form.role}
        onChange={v => set("role", v)}
        options={ROLES}
      />
      <ChipRadio
        legend="Ticket Type"
        name="track"
        value={form.track}
        onChange={v => set("track", v as RegistrationTrack)}
        options={TRACK_OPTIONS}
      />
      <Field label="How did you hear about TEDxClifton? (optional)" htmlFor="r-referral">
        <Input
          id="r-referral"
          type="text"
          placeholder="Social media, a friend, news article…"
          value={form.referral}
          onChange={e => set("referral", e.target.value)}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-[#FF6B8E]">{error}</p>
      )}

      <div className="pt-3 border-t border-white/10">
        <motion.div whileTap={{ scale: 0.98 }}>
          <button
            type="submit"
            className="kx-btn-primary w-full justify-center !px-7 !py-4 !text-[15px]"
            disabled={submitting || !form.fullName || !form.email || !form.role}
          >
            {submitting ? "Reserving…" : "Reserve My Seat"}
            {!submitting && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </motion.div>
        <p className="mt-3 text-center text-[11px] text-white/30">
          Limited seats. Your details are used only for event logistics, and we&apos;ll confirm your ticket by email.
        </p>
        <p className="mt-4 text-center text-[12px] text-white/40">
          Want to be on stage instead?{" "}
          <Link href="/submit" className="text-khi-blue-bright hover:underline inline-flex items-center gap-1">
            <Mic size={12} aria-hidden="true" /> Apply to speak
          </Link>
        </p>
      </div>
    </form>
  );
}
