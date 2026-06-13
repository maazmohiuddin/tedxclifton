"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ReactNode } from "react";

export function Success({
  title,
  children,
  idChip,
}: {
  title: ReactNode;
  children: ReactNode;
  idChip?: string;
}) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-[640px] rounded-3xl border border-khi-blue/30 bg-white/[0.04] p-10 md:p-12 text-center"
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="mx-auto mb-5 grid place-items-center w-16 h-16 rounded-full bg-khi-blue/15 border border-khi-blue/30 text-khi-blue-bright"
        style={{ boxShadow: "0 0 32px rgba(49,107,255,0.32)" }}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 380, damping: 18 }}
      >
        <Check size={28} strokeWidth={3} aria-hidden="true" />
      </motion.div>
      <motion.h2
        className="font-display text-2xl md:text-3xl font-extrabold text-white -tracking-tight"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
      </motion.h2>
      <motion.div
        className="mt-3 text-white/70 leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
      {idChip && (
        <motion.div
          className="mt-5"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-block rounded-full bg-khi-blue/10 border border-khi-blue/30 px-4 py-1.5 font-mono text-xs text-khi-blue-soft tracking-wider">
            {idChip}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
