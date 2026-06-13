"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

const SPONSORS = [
  { name: "Aurora Labs",      tier: "Title" },
  { name: "Mehran Capital",   tier: "Platinum" },
  { name: "BluePeak",         tier: "Platinum" },
  { name: "Karachi Bytes",    tier: "Gold" },
  { name: "Sindh Connect",    tier: "Gold" },
  { name: "Northstar AI",     tier: "Gold" },
  { name: "Helix Cloud",      tier: "Silver" },
  { name: "Stellar Pay",      tier: "Silver" },
] as const;

const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const gridItem = {
  hidden: { opacity: 0, scale: 0.88 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function SponsorMark({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3 px-6 py-4 select-none">
      <span
        className="grid place-items-center w-9 h-9 rounded-lg border border-white/20 text-white font-display font-extrabold text-sm"
        aria-hidden="true"
      >
        {initials}
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export function Sponsors() {
  const reduced = useReducedMotion();
  return (
    <section
      aria-labelledby="sponsors-title"
      className="kx-section"
    >
      <Reveal>
        <div className="text-center max-w-[600px] mx-auto">
          <p className="kx-eyebrow justify-center mb-5">Backed By</p>
          <h2
            id="sponsors-title"
            className="font-display text-[clamp(32px,4.5vw,52px)] font-extrabold text-white"
            style={{ letterSpacing: "-0.035em", lineHeight: 1.06 }}
          >
            Built with our <span className="kx-accent">partners.</span>
          </h2>
          <p className="mt-5 text-white/55 leading-relaxed">
            TEDxClifton is co-built with Pakistan&apos;s leading enterprises, investors and platform partners.
          </p>
        </div>
      </Reveal>

      <motion.ul
        className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border border-white/10 rounded-2xl overflow-hidden bg-white/[0.012]"
        aria-label="TEDxClifton sponsor list"
        variants={reduced ? undefined : gridContainer}
        initial={reduced ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        {SPONSORS.map((s, i) => (
          <motion.li
            key={s.name}
            variants={reduced ? undefined : gridItem}
            className={`flex justify-center items-center min-h-[110px] hover:bg-khi-blue/[0.06] transition-colors duration-300 ease-soft ${
              i % 4 !== 3 ? "lg:border-r border-white/10" : ""
            } ${i % 3 !== 2 ? "sm:border-r lg:border-r-0 border-white/10" : ""} ${
              i % 2 !== 1 ? "border-r sm:border-r-0 lg:border-r border-white/10" : ""
            } ${
              i < SPONSORS.length - 2 ? "border-b border-white/10" : ""
            }`}
          >
            <div className="sponsor-logo">
              <SponsorMark name={s.name} />
            </div>
            <span className="sr-only">{s.tier} sponsor</span>
          </motion.li>
        ))}
      </motion.ul>
      <p className="text-center mt-6 text-xs text-white/30 uppercase tracking-widest">
        Sponsor lineup announced 30 days before the event.
      </p>
    </section>
  );
}
