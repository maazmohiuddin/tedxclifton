"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const initial = reduced ? false : { opacity: 0, y: 20 };

  return (
    <header className="relative isolate overflow-hidden bg-khi-ink-soft border-b border-white/10 text-center px-6 md:px-14 pt-24 md:pt-32 pb-14 md:pb-20">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 animate-grid-drift"
        style={{
          backgroundImage:
            "linear-gradient(rgba(49,107,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(49,107,255,0.14) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 0%, transparent 80%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(49,107,255,0.22) 0%, transparent 60%)",
        }}
      />
      <motion.p
        className="kx-eyebrow justify-center mb-4"
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {eyebrow}
      </motion.p>
      <motion.h1
        className="font-display font-extrabold text-white text-[clamp(40px,7vw,96px)]"
        style={{ letterSpacing: "-0.045em", lineHeight: 0.98 }}
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
      </motion.h1>
      {children && (
        <motion.p
          className="mt-5 mx-auto max-w-[640px] text-[15px] md:text-base text-white/70 leading-relaxed"
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.p>
      )}
    </header>
  );
}
