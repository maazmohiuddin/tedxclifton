"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Paperclip, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ChipRadio } from "@/components/ui/ChipRadio";
import { Success } from "@/components/ui/Success";

const THEMES = [
  "Technology",
  "Science",
  "Design",
  "Business",
  "Society & Culture",
  "Arts & Performance",
  "Education",
  "Health & Wellbeing",
  "Personal Story",
  "Other",
] as const;

const EXPERIENCE = ["First-time speaker", "Some experience", "Experienced speaker"] as const;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = ".pdf,.ppt,.pptx,.zip,.doc,.docx,.mp4,.mov";

interface FormState {
  fullName: string;
  email: string;
  project: string;     // talk title
  category: string;    // theme
  description: string; // idea + bio
  teamSize: string;    // speaking experience
}

export function SubmitForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    project: "",
    category: "",
    description: "",
    teamSize: "First-time speaker",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; name: string } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(s => ({ ...s, [key]: value }));
  }

  function handleFile(f: File | null) {
    setFileError(null);
    if (!f) { setFile(null); return; }
    if (f.size > MAX_FILE_BYTES) {
      setFileError("File is too large — keep it under 10 MB.");
      return;
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.project || !form.category || !form.description) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    let filePath: string | null = null;

    try {
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("submissions")
          .upload(key, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        filePath = key;
      }

      const submissionId = crypto.randomUUID();
      const { error: insErr } = await supabase
        .from("submissions")
        .insert({
          id: submissionId,
          full_name: form.fullName,
          email: form.email.trim().toLowerCase(),
          project: form.project,
          category: form.category,
          description: form.description,
          team_size: form.teamSize,
          file_path: filePath,
        });

      if (insErr) throw insErr;
      setDone({ id: submissionId.slice(0, 8).toUpperCase(), name: form.fullName });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submission failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Success
        title={<>Proposal <span className="kx-accent">received.</span></>}
        idChip={`S-${done.id}`}
      >
        <p>
          Thank you, <strong className="text-white">{done.name}</strong>. Your talk proposal has been submitted to the
          TEDxClifton curation team. If your idea is a fit, we&apos;ll reach out by email to take the next step.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link href="/register" className="kx-btn-primary">
            Also reserve a seat
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
        <Field label="Full Name" htmlFor="s-name" required>
          <Input id="s-name" type="text" placeholder="Ayesha Khan" autoComplete="name" required value={form.fullName} onChange={e => set("fullName", e.target.value)} />
        </Field>
        <Field label="Email Address" htmlFor="s-email" required>
          <Input id="s-email" type="email" placeholder="you@example.com" autoComplete="email" required value={form.email} onChange={e => set("email", e.target.value)} />
        </Field>
      </div>

      <Field label="Talk Title" htmlFor="s-project" required>
        <Input id="s-project" type="text" placeholder="e.g. Why failure is the best teacher" required value={form.project} onChange={e => set("project", e.target.value)} />
      </Field>

      <ChipRadio
        legend="Talk Theme"
        name="category"
        required
        value={form.category}
        onChange={v => set("category", v)}
        options={THEMES as unknown as string[]}
      />

      <Field
        label="Your Idea & Short Bio"
        htmlFor="s-desc"
        required
        hint="What is the one idea worth spreading? Why you, why now? Add a couple of lines about yourself."
      >
        <Textarea id="s-desc" required value={form.description} onChange={e => set("description", e.target.value)} placeholder="Share your idea and a short bio…" />
      </Field>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Speaking Experience" htmlFor="s-team">
          <select
            id="s-team"
            className="kx-input"
            value={form.teamSize}
            onChange={e => set("teamSize", e.target.value)}
          >
            {EXPERIENCE.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Field label="Showreel / Deck (optional)" htmlFor="s-file" error={fileError ?? undefined} hint="PDF, PPT, ZIP or video — max 10 MB">
          <div
            className={`rounded-2xl border border-dashed px-5 py-7 text-center bg-white/[0.02] transition-all duration-200 ease-soft ${
              drag ? "border-khi-blue bg-khi-blue/5 ring-2 ring-khi-blue/40" : "border-white/15 hover:border-khi-blue/40"
            }`}
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload showreel or deck"
          >
            <input
              ref={fileRef}
              id="s-file"
              type="file"
              accept={ACCEPTED}
              className="sr-only"
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
            />
            <div className="font-display text-sm font-bold text-white">
              {file ? "File attached" : "Drop file or click to browse"}
            </div>
            <AnimatePresence>
              {file && (
                <motion.div
                  key="file-badge"
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 6 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-3 inline-flex items-center gap-2.5 rounded-full bg-khi-blue/10 border border-khi-blue/30 px-3.5 py-1.5 text-xs text-khi-blue-soft"
                >
                  <Paperclip size={12} aria-hidden="true" />
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button type="button" aria-label="Remove file" className="text-white/60 hover:text-white" onClick={e => { e.stopPropagation(); setFile(null); }}>
                    <X size={12} aria-hidden="true" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-sm text-[#FF6B8E]">{error}</p>
      )}

      <div className="pt-3 border-t border-white/10">
        <motion.div whileTap={{ scale: 0.98 }}>
          <button
            type="submit"
            className="kx-btn-primary w-full justify-center !px-7 !py-4 !text-[15px]"
            disabled={submitting || !form.fullName || !form.email || !form.project || !form.category || !form.description}
          >
            {submitting ? "Submitting…" : "Submit Talk Proposal"}
            {!submitting && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </motion.div>
        <p className="mt-3 text-center text-[11px] text-white/30">
          By submitting you agree to the TEDxClifton speaker guidelines. Our team reviews every proposal.
        </p>
      </div>
    </form>
  );
}
