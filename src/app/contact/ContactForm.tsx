"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Success } from "@/components/ui/Success";
import Link from "next/link";

interface FormState { name: string; email: string; subject: string; message: string }

export function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm(s => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Success
        title={<>Message <span className="kx-accent">sent.</span></>}
        idChip="✓ Received"
      >
        <p>
          Thanks, <strong className="text-white">{form.name}</strong>. We&apos;ve received your message and will reply to{" "}
          <strong className="text-white">{form.email}</strong> within 24 hours.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link href="/" className="kx-btn kx-btn-primary">Back to home <ArrowRight size={15} /></Link>
          <Link href="/register" className="kx-btn kx-btn-outline">Register for TEDxClifton</Link>
        </div>
      </Success>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-[640px] flex flex-col gap-5" noValidate>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Your Name" htmlFor="c-name" required>
          <Input id="c-name" type="text" placeholder="Ahmed Raza" autoComplete="name" required value={form.name} onChange={e => set("name", e.target.value)} />
        </Field>
        <Field label="Email Address" htmlFor="c-email" required>
          <Input id="c-email" type="email" placeholder="you@example.com" autoComplete="email" required value={form.email} onChange={e => set("email", e.target.value)} />
        </Field>
      </div>

      <Field label="Subject" htmlFor="c-subject" required>
        <Input id="c-subject" type="text" placeholder="Query about VIP tickets" required value={form.subject} onChange={e => set("subject", e.target.value)} />
      </Field>

      <Field label="Message" htmlFor="c-message" required hint="Be as detailed as you like — we read every message.">
        <Textarea id="c-message" required value={form.message} onChange={e => set("message", e.target.value)} placeholder="Hi, I'd like to ask about…" />
      </Field>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="alert"
            className="text-sm text-[#FF6B8E]"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="pt-3 border-t border-white/10">
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="kx-btn kx-btn-primary w-full justify-center !px-7 !py-4 !text-[15px]"
          disabled={submitting || !form.name || !form.email || !form.subject || !form.message}
        >
          {submitting ? "Sending…" : "Send Message"}
          {!submitting && <Send size={15} />}
        </motion.button>
        <p className="mt-3 text-center text-[11px] text-white/30">
          We reply from hello@tedxclifton.com · Usually within 24 hours
        </p>
      </div>
    </form>
  );
}
