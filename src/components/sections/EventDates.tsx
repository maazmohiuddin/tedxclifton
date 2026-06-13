"use client";

import { motion } from "framer-motion";
import { CalendarDays, MapPin, Mic, Sparkles } from "lucide-react";

const DATES = [
  { icon: CalendarDays, label: "Date",   value: "Coming Soon · 2026" },
  { icon: MapPin,       label: "Venue",  value: "Clifton, Karachi" },
  { icon: Mic,          label: "Format", value: "18-minute talks" },
  { icon: Sparkles,     label: "Theme",  value: "Next is Now" },
] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function EventDates() {
  return (
    <section
      aria-labelledby="event-dates"
      className="border-t border-b border-white/10 bg-white/[0.012]"
    >
      <div className="max-w-page mx-auto px-6 md:px-14 py-10 md:py-12">
        <h2 id="event-dates" className="sr-only">Event details</h2>
        <motion.ul
          className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/10"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {DATES.map(({ icon: Icon, label, value }) => (
            <motion.li
              key={label}
              variants={item}
              className="bg-khi-ink p-6 md:p-7 flex flex-col gap-3 group transition-colors duration-300 ease-soft hover:bg-white/[0.02]"
            >
              <Icon size={18} className="text-khi-blue transition-transform duration-300 ease-soft group-hover:scale-110 group-hover:-rotate-3" aria-hidden="true" />
              <div className="text-[10px] md:text-[11px] font-bold uppercase text-white/30" style={{ letterSpacing: "0.18em" }}>
                {label}
              </div>
              <div className="font-display text-base md:text-lg font-bold text-white -tracking-wider">
                {value}
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
