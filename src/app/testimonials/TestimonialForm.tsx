"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Camera, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { StarRating } from "@/components/ui/StarRating";
import { Success } from "@/components/ui/Success";
import { VerificationBadge } from "@/components/testimonials/VerificationBadge";
import type { VerificationTier } from "@/lib/types";

const MAX_AVATAR_MB = 5;

interface FormState {
  fullName: string;
  email: string;
  designation: string;
  company: string;
  body: string;
  rating: number | null;
}

interface DoneState {
  verification: VerificationTier;
}

export function TestimonialForm() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    designation: "",
    company: "",
    body: "",
    rating: null,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DoneState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(s => ({ ...s, [key]: value }));
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Profile picture must be an image.");
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setError(`Profile picture must be under ${MAX_AVATAR_MB}MB.`);
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function clearFile() {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || form.body.trim().length < 10) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. Upload avatar (optional) to the public bucket.
      let avatarPath: string | null = null;
      if (avatarFile) {
        const supabase = createClient();
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("testimonials")
          .upload(path, avatarFile, { cacheControl: "3600", upsert: false });
        if (upErr) throw new Error("Could not upload your photo. Please try again.");
        avatarPath = path;
      }

      // 2. Submit the testimonial (verification computed server-side).
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          designation: form.designation,
          company: form.company,
          body: form.body,
          rating: form.rating,
          avatarPath,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setDone({ verification: data.verification as VerificationTier });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (done) {
    const verified = done.verification !== "community";
    return (
      <Success title={<>Thank you for your <span className="kx-accent">feedback.</span></>}>
        <p>
          Your testimonial has been submitted successfully and is now{" "}
          <strong className="text-white">pending review</strong>. Once approved by our team,
          it will appear on the TEDxClifton website.
        </p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-white/35">Your status</span>
          <VerificationBadge tier={done.verification} />
          <p className="text-xs text-white/45 max-w-sm mt-1">
            {verified
              ? "We matched your email to our attendee records — your testimonial will carry a verified badge."
              : "We couldn't match your email to our attendee records, so you'll appear as a community member."}
          </p>
        </div>
        <div className="mt-7 flex flex-wrap gap-3 justify-center">
          <Link href="/" className="kx-btn-primary">
            Back to home
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </Success>
    );
  }

  const canSubmit = form.fullName.trim() && form.email.trim() && form.body.trim().length >= 10;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-[640px] flex flex-col gap-5" noValidate>
      {/* Avatar uploader */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative grid place-items-center w-20 h-20 rounded-full border-2 border-dashed border-white/20 hover:border-khi-blue/60 transition-colors overflow-hidden bg-white/[0.03] shrink-0"
          aria-label="Upload profile picture"
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <Camera size={22} className="text-white/40" aria-hidden="true" />
          )}
        </button>
        <div>
          <p className="text-sm text-white/80 font-medium">Profile picture <span className="text-white/35">(optional)</span></p>
          <p className="text-[11px] text-white/35 mt-0.5">JPG or PNG, up to {MAX_AVATAR_MB}MB.</p>
          {avatarPreview && (
            <button
              type="button"
              onClick={clearFile}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#FF6B8E] hover:text-white transition-colors"
            >
              <X size={11} /> Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Full Name" htmlFor="t-name" required>
          <Input
            id="t-name"
            type="text"
            placeholder="Ahmed Raza"
            autoComplete="name"
            required
            value={form.fullName}
            onChange={e => set("fullName", e.target.value)}
          />
        </Field>
        <Field label="Email Address" htmlFor="t-email" required hint="Used to verify your attendance — never shown publicly.">
          <Input
            id="t-email"
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
        <Field label="Designation / Job Title" htmlFor="t-role">
          <Input
            id="t-role"
            type="text"
            placeholder="Head of AI"
            autoComplete="organization-title"
            value={form.designation}
            onChange={e => set("designation", e.target.value)}
          />
        </Field>
        <Field label="Company / Organisation (optional)" htmlFor="t-company">
          <Input
            id="t-company"
            type="text"
            placeholder="Acme Inc."
            autoComplete="organization"
            value={form.company}
            onChange={e => set("company", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Your Feedback" htmlFor="t-body" required>
        <Textarea
          id="t-body"
          placeholder="Share your experience at TEDxClifton — the talks, the people, the energy…"
          required
          maxLength={2000}
          value={form.body}
          onChange={e => set("body", e.target.value)}
        />
      </Field>

      <div>
        <p className="kx-label mb-2">Rate your experience <span className="text-white/35">(optional)</span></p>
        <StarRating value={form.rating} onChange={v => set("rating", v)} />
      </div>

      {error && <p role="alert" className="text-sm text-[#FF6B8E]">{error}</p>}

      <div className="pt-3 border-t border-white/10">
        <motion.div whileTap={{ scale: 0.98 }}>
          <button
            type="submit"
            className="kx-btn-primary w-full justify-center !px-7 !py-4 !text-[15px]"
            disabled={submitting || !canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>
                Submit Feedback
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </motion.div>
        <p className="mt-3 text-center text-[11px] text-white/30">
          All testimonials are reviewed before appearing publicly.
        </p>
      </div>
    </form>
  );
}
