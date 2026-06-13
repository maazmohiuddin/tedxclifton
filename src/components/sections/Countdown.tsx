"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

// 7 June 2026 00:00 Pakistan time (UTC+5)
const EVENT_TARGET_MS = Date.UTC(2026, 5, 6, 19, 0, 0); // 6 June 19:00 UTC == 7 June 00:00 PKT

type Cell = { label: string; value: number };

function diff(now: number): Cell[] {
  const ms = Math.max(0, EVENT_TARGET_MS - now);
  const s = Math.floor(ms / 1000);
  const days  = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins  = Math.floor((s % 3600) / 60);
  const secs  = s % 60;
  return [
    { label: "Days",    value: days },
    { label: "Hours",   value: hours },
    { label: "Minutes", value: mins },
    { label: "Seconds", value: secs },
  ];
}

export function Countdown() {
  const reduced = useReducedMotion();
  const [now, setNow] = useState<number>(() => Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const cells = useMemo(() => diff(now), [now]);
  const isLive = mounted; // suppress SSR mismatch on numbers

  return (
    <section
      aria-labelledby="countdown-title"
      className="relative isolate overflow-hidden border-t border-b border-white/10"
    >
      {/* Ambient glow background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 20% 50%, rgba(49,107,255,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 85% 50%, rgba(143,175,255,0.10) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(49,107,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(49,107,255,0.10) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 100% at 50% 50%, #000 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 100% at 50% 50%, #000 0%, transparent 80%)",
          opacity: 0.45,
        }}
      />

      <div className="max-w-page mx-auto px-6 md:px-14 py-16 md:py-24 text-center">
        <Reveal>
          <p className="kx-eyebrow mb-5 justify-center">Counting down</p>
          <h2
            id="countdown-title"
            className="font-display text-[clamp(32px,5vw,60px)] font-extrabold text-white max-w-[760px] mx-auto"
            style={{ letterSpacing: "-0.035em", lineHeight: 1.05 }}
          >
            The future starts in <span className="kx-accent">T-minus.</span>
          </h2>
          <p className="mt-4 max-w-[520px] mx-auto text-white/55 leading-relaxed">
            Sunday, 7 June 2026 · Karachi, Pakistan.<br className="hidden sm:inline" />
            One day. Seven domains. A decade of shifts.
          </p>
        </Reveal>

        <ul
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-[820px] mx-auto"
          aria-label="Time remaining until TEDxClifton"
          aria-live="polite"
        >
          {cells.map((c, i) => (
            <motion.li
              key={c.label}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative group"
            >
              <div
                className="relative rounded-2xl bg-white/[0.03] border border-white/10 p-5 md:p-7 overflow-hidden transition-all duration-300 ease-soft group-hover:border-khi-blue/40"
                style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}
              >
                {/* Top sheen */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(143,175,255,0.5) 50%, transparent 100%)" }}
                />
                {/* Number */}
                <div
                  className="font-display font-extrabold text-white tabular-nums leading-none overflow-hidden"
                  style={{ fontSize: "clamp(40px,6vw,72px)", letterSpacing: "-0.045em", height: "1em" }}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={isLive ? c.value : "loading"}
                      initial={reduced ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={reduced ? { y: 0, opacity: 1 } : { y: "-100%", opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {isLive ? String(c.value).padStart(2, "0") : "--"}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* Label */}
                <div
                  className="mt-3 text-[10px] md:text-[11px] uppercase text-white/35 font-bold"
                  style={{ letterSpacing: "0.24em" }}
                >
                  {c.label}
                </div>
                {/* Bottom glow on hover */}
                <div
                  aria-hidden="true"
                  className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(ellipse, rgba(49,107,255,0.6) 0%, transparent 70%)",
                    filter: "blur(12px)",
                  }}
                />
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
