"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Mic } from "lucide-react";
import { useRef } from "react";
import { InteractiveNebulaShader } from "@/components/ui/liquid-shader";

export function Hero() {
  const reduced = useReducedMotion();
  const initial = reduced ? false : { opacity: 0, y: 28 };

  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduced ? 1 : 0.2]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative min-h-[calc(100svh-76px)] grid place-items-center text-center px-5 md:px-10 py-20 md:py-24 overflow-hidden isolate bg-khi-ink"
    >
      {/* Shader background */}
      <div className="absolute inset-0 -z-30 overflow-hidden" aria-hidden="true">
        <InteractiveNebulaShader />
      </div>

      {/* Dark readability overlay — fades edges to ink, keeps centre luminous */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 110% 70% at 50% 50%, rgba(10,2,4,0.18) 0%, rgba(10,2,4,0.80) 100%)",
            "linear-gradient(to bottom, rgba(10,2,4,0.55) 0%, rgba(10,2,4,0.12) 30%, rgba(10,2,4,0.12) 70%, rgba(10,2,4,0.74) 100%)",
          ].join(", "),
        }}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-khi-blue/10 border border-khi-blue/30 text-[11px] md:text-xs font-medium uppercase text-khi-blue-soft mb-8"
          style={{ letterSpacing: "0.16em" }}
        >
          <span
            aria-hidden="true"
            className="w-[7px] h-[7px] rounded-full bg-khi-blue animate-pulse-dot"
          />
          2026 · Clifton, Karachi · Tickets Soon
        </motion.div>

        <motion.h1
          id="hero-title"
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(58px,12vw,150px)] font-extrabold leading-[0.92] text-white max-w-[1100px] kx-head-glow"
          style={{ letterSpacing: "-0.05em" }}
        >
          Next is <span className="kx-accent">Now</span>
        </motion.h1>

        <motion.p
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-[11px] md:text-sm uppercase text-white/45"
          style={{ letterSpacing: "0.32em" }}
        >
          x = an independently organized TED event
        </motion.p>

        <motion.p
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-[560px] text-[15px] md:text-base text-white/60 leading-relaxed"
        >
          A day of bold talks, big ideas, and the people redefining what&apos;s next —
          live from Clifton, Karachi.
        </motion.p>

        <motion.div
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex gap-3 flex-wrap justify-center"
        >
          <motion.div whileTap={{ scale: 0.96 }}>
            <Link href="/register" className="kx-btn-primary animate-btn-glow">
              Get Tickets
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </motion.div>
          <motion.div whileTap={{ scale: 0.96 }}>
            <Link href="/submit" className="kx-btn-outline">
              <Mic size={15} aria-hidden="true" />
              Apply to Speak
            </Link>
          </motion.div>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 md:bottom-0 flex flex-col items-center gap-1.5 text-white/30"
          aria-hidden="true"
        >
          <span className="text-[9px] uppercase font-bold" style={{ letterSpacing: "0.36em" }}>Scroll</span>
          <span className="block w-px h-9 bg-gradient-to-b from-white/30 to-transparent animate-scroll-cue" />
        </motion.div>
      </motion.div>
    </section>
  );
}
