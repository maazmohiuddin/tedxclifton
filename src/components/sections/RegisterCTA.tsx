"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic } from "lucide-react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export function RegisterCTA() {
  return (
    <section
      aria-labelledby="cta-title"
      className="kx-section relative overflow-hidden isolate"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(235,0,40,0.18) 0%, transparent 65%)",
        }}
      />
      <motion.div
        className="text-center max-w-[720px] mx-auto"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.p variants={item} className="kx-eyebrow justify-center mb-5">Be Part Of It</motion.p>
        <motion.h2
          id="cta-title"
          variants={item}
          className="font-display text-[clamp(38px,5.5vw,72px)] font-extrabold text-white kx-head-glow"
          style={{ letterSpacing: "-0.05em", lineHeight: 1.02 }}
        >
          Next is <span className="kx-accent">Now.</span>
        </motion.h2>
        <motion.p variants={item} className="mt-6 text-white/55 leading-relaxed max-w-[520px] mx-auto">
          Join us in Clifton, Karachi for a day of bold talks and big ideas. Reserve your seat,
          or step onto the red dot yourself — the stage is open for the next idea worth spreading.
        </motion.p>
        <motion.div variants={item} className="mt-10 flex flex-wrap justify-center gap-3">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link href="/register" className="kx-btn-primary animate-btn-glow">
              Get Tickets
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link href="/submit" className="kx-btn-outline">
              <Mic size={15} aria-hidden="true" />
              Apply to Speak
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
