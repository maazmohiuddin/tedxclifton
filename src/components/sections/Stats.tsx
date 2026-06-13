"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

// Our last event — "Breaking Boundaries" (TEDxClifton Karachi)
const STATS = [
  { target: 1000, acc: "+", label: "Attendees" },
  { target: 200,  acc: "+", label: "CEOs & Leaders" },
  { target: 20,   acc: "+", label: "Speakers on Stage" },
  { target: 12,   acc: "+", label: "Ideas Worth Spreading" },
] as const;

const fmt = (n: number) => Math.floor(n).toLocaleString();

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function Stats() {
  const reduced = useReducedMotion();
  return (
    <section
      aria-labelledby="stats-title"
      className="border-t border-b border-white/10 relative isolate"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 50%, rgba(235,0,40,0.06) 0%, transparent 70%)",
        }}
      />
      <h2 id="stats-title" className="sr-only">TEDxClifton — our last event in numbers</h2>
      <motion.ul
        className="grid grid-cols-2 lg:grid-cols-4 max-w-page mx-auto"
        variants={reduced ? undefined : container}
        initial={reduced ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        {STATS.map((s, i) => (
          <motion.li
            key={s.label}
            variants={reduced ? undefined : item}
            className={`text-center py-10 md:py-12 px-5 ${
              i < STATS.length - 1 ? "lg:border-r lg:border-white/10" : ""
            } ${i < 2 ? "md:border-b-0 border-b border-white/10 lg:border-b-0" : ""} ${
              i === 0 ? "border-r border-white/10" : ""
            } ${i === 2 ? "border-r border-white/10 lg:border-r" : ""}`}
          >
            <Counter target={s.target} acc={s.acc} />
            <div className="mt-2 text-xs md:text-sm text-white/45 tracking-wide">{s.label}</div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

function Counter({
  target,
  acc,
}: {
  target: number;
  acc: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <div
      ref={ref}
      className="font-display font-extrabold text-white text-[clamp(40px,5.5vw,60px)] leading-none tabular-nums"
      style={{ letterSpacing: "-0.04em" }}
    >
      {fmt(value)}<span className="text-khi-blue">{acc}</span>
    </div>
  );
}
