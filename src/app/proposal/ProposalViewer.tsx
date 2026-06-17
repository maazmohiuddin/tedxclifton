"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useInView,
  animate,
} from "framer-motion";
import { Download, Lock, Loader2, Mail } from "lucide-react";
import { PROPOSAL_PDF_NAME, PROPOSAL_PAGES } from "./pages";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function fetchAsDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise<string | null>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerList({ items, delay = 0 }: { items: string[]; delay?: number }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: delay + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start gap-3 text-sm text-white/65 leading-relaxed"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e62b1e]" />
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070103]">
      {/* radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e62b1e]/8 blur-[140px]" />
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-[#e62b1e]/5 blur-[100px]" />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* TEDx wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="font-display text-3xl font-black tracking-tight">
            <span className="text-[#e62b1e]">TED</span>
            <span className="text-[#e62b1e] text-lg align-super">x</span>
            <span className="text-white"> Clifton</span>
          </div>
          <div className="mt-1.5 text-[11px] tracking-[0.3em] text-white/35 uppercase">
            x = independently organized TED event
          </div>
        </motion.div>

        {/* headline */}
        <div className="overflow-hidden pb-2">
          <motion.h1
            initial={{ y: 110, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
            className="font-display font-black leading-[0.9] tracking-tight"
            style={{ fontSize: "clamp(3.5rem,13vw,9rem)" }}
          >
            <span className="text-white">Next is </span>
            <span className="text-[#e62b1e] italic">Now</span>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-5 text-base font-semibold uppercase tracking-[0.35em] text-white/50"
        >
          Sponsorship Proposal
        </motion.p>

        {/* giant X watermark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.08, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 select-none font-black leading-none"
          style={{
            fontSize: "clamp(220px,55vw,480px)",
            WebkitTextStroke: "3px #e62b1e",
            color: "transparent",
          }}
        >
          X
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/25"
      >
        <span className="text-[9px] uppercase tracking-[0.3em]">Scroll</span>
        <motion.div
          animate={{ scaleY: [1, 1.6, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          className="h-7 w-px bg-gradient-to-b from-white/30 to-transparent origin-top"
        />
      </motion.div>
    </section>
  );
}

// ─── About TEDx + bar chart ───────────────────────────────────────────────────

const SOCIAL_STATS = [
  { label: "YouTube", value: 42 },
  { label: "LinkedIn", value: 7 },
  { label: "Facebook", value: 17 },
  { label: "X", value: 10 },
  { label: "Instagram", value: 15 },
];

function BarChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const max = 42;

  return (
    <div ref={ref} className="mt-8">
      <div className="flex items-end justify-between gap-3" style={{ height: 160 }}>
        {SOCIAL_STATS.map((s, i) => (
          <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="text-xs font-bold text-white"
            >
              {s.value}M
            </motion.span>
            <div className="relative w-full rounded-t overflow-hidden" style={{ height: `${(s.value / max) * 120}px` }}>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{ delay: i * 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ originY: 1 }}
                className="absolute inset-0 rounded-t bg-[#e62b1e]"
              />
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.1 + 0.5 }}
              className="text-[10px] text-white/45 text-center leading-tight"
            >
              {s.label}
            </motion.span>
          </div>
        ))}
      </div>
      <div className="mt-2 h-px w-full bg-white/10" />
    </div>
  );
}

function AboutSection() {
  return (
    <section className="bg-[#0a0102] py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black">
            About <span className="text-[#e62b1e]">TEDx</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-6 space-y-4 text-sm leading-relaxed text-white/65">
          <p>TED (Technology, Entertainment, Design) is a nonprofit organization devoted to Ideas Worth Spreading. Started as a four-day conference in California 30 years ago, TED has grown into a worldwide movement known for its two annual TED Conferences, where the world's leading thinkers and doers are invited to speak for 18 minutes or less.</p>
          <p>The annual TED Conference takes place each spring in Vancouver, British Columbia. TED's media initiatives include TED.com, where new TED Talks are posted daily; TED Translators, which provides subtitles and interactive transcripts; and the educational initiative TED-Ed.</p>
          <p>TED has established The Audacious Project — a collaborative approach to funding ideas at thrilling scale. TEDx supports individuals or groups in hosting local, self-organized TED-style events around the world, and the TED Fellows program helps world-changing innovators amplify their impact.</p>
        </Reveal>

        <Reveal delay={0.2} className="mt-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/35">Global Reach</span>
            <div className="h-2 w-2 rounded-full bg-[#e62b1e]" />
          </div>
          <BarChart />
        </Reveal>
      </div>
    </section>
  );
}

// ─── Our Last Event ───────────────────────────────────────────────────────────

function LastEventSection() {
  return (
    <section className="bg-[#070103] py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black">
            Our Last <span className="text-[#e62b1e]">Event</span>
          </h2>
        </Reveal>
        <Reveal delay={0.05} className="mt-2 text-sm font-medium text-white/40 tracking-wide">
          TEDxClifton Karachi: Breaking Boundaries — A Landmark Event in Pakistan's TEDx History
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { n: "1000+", label: "Attendees" },
            { n: "200+", label: "CEOs & Leaders" },
            { n: "10+", label: "Speakers" },
            { n: "#1", label: "In Pakistan" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <motion.div
                whileHover={{ borderColor: "rgba(230,43,30,0.5)", backgroundColor: "rgba(230,43,30,0.06)" }}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center transition-colors duration-300 cursor-default"
              >
                <div className="font-display text-3xl font-black text-[#e62b1e]">{s.n}</div>
                <div className="mt-1 text-[11px] text-white/45">{s.label}</div>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="mt-8 space-y-4 text-sm leading-relaxed text-white/65">
          <p>On February 25th, TEDxClifton Karachi hosted one of the most successful and impactful TEDx events ever held in Pakistan, centered around the powerful theme: <em>"Breaking Boundaries"</em> — a call to push past limitations, challenge societal norms, and redefine what's possible.</p>
          <p>One of our international speakers — a former official TED speaker — publicly compared TEDxClifton Karachi to some of the most prestigious TED events in the United States, calling it <em>"a globally competitive TEDx experience that sets a new benchmark for Pakistan."</em></p>
        </Reveal>

        <Reveal delay={0.2} className="mt-6">
          <p className="text-sm text-white/40 mb-3">Guests and speakers applauded:</p>
          <StaggerList
            delay={0.05}
            items={[
              "The meticulous organization",
              "The diversity and depth of the talks",
              "The electrifying energy of the crowd",
              "The vision of the team behind it all",
            ]}
          />
        </Reveal>
      </div>
    </section>
  );
}

// ─── Photo Collage ────────────────────────────────────────────────────────────

function PhotoCollageSection() {
  return (
    <section className="bg-[#0a0102] py-16 px-6">
      <Reveal className="mx-auto max-w-3xl">
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/proposal/page-04.jpg" alt="TEDxClifton Breaking Boundaries event photos" className="block h-auto w-full select-none" draggable={false} />
        </motion.div>
      </Reveal>
    </section>
  );
}

// ─── Speakers (image panels) ──────────────────────────────────────────────────

function SpeakersSection({ version, imgSrc }: { version: string; imgSrc: string }) {
  return (
    <section className="bg-[#070103] py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black mb-8">
            Previous <span className="text-[#e62b1e]">{version}</span> Speakers
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc} alt={`TEDxClifton ${version} Speakers`} className="block h-auto w-full select-none" draggable={false} />
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Become a Sponsor ─────────────────────────────────────────────────────────

function BecomeASponsorSection() {
  const highlights = [
    { icon: "🗓", label: "1 Day", desc: "High-impact conference" },
    { icon: "🎤", label: "12 Speakers", desc: "World-class lineup" },
    { icon: "👥", label: "2000+", desc: "Expected attendees" },
    { icon: "⏱", label: "300 Min", desc: "Community building" },
  ];

  return (
    <section className="bg-[#0a0102] py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black leading-tight">
            Become a <span className="text-[#e62b1e]">Sponsor</span> for<br />
            TEDxClifton 3.0
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {highlights.map((h, i) => (
            <Reveal key={h.label} delay={i * 0.09}>
              <motion.div
                whileHover={{ y: -5, borderColor: "rgba(230,43,30,0.45)", backgroundColor: "rgba(230,43,30,0.06)" }}
                className="cursor-default rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center transition-all duration-300"
              >
                <div className="text-3xl mb-2">{h.icon}</div>
                <div className="font-display text-xl font-black text-white">{h.label}</div>
                <div className="mt-1 text-[11px] text-white/40">{h.desc}</div>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10 space-y-4 text-sm leading-relaxed text-white/65">
          <p>TEDxClifton Karachi is seeking community sponsors to help bring our 2025 event to life. Partnering with us means connecting your brand with the global TED network while celebrating the unique, dynamic spirit of Karachi.</p>
          <p>Our event will bring together bold thinkers and curious minds eager to challenge the status quo. Sponsoring TEDxClifton Karachi offers a chance to support innovation, amplify your brand, and engage with a passionate local and global audience.</p>
        </Reveal>

        <Reveal delay={0.25} className="mt-8 flex flex-wrap gap-3">
          <a
            href="mailto:tedxcliftonkarachi@gmail.com"
            className="inline-flex items-center gap-2 rounded-full bg-[#e62b1e] px-6 py-3 text-sm font-bold text-white hover:bg-[#c41e13] transition-colors"
          >
            <Mail size={14} />
            Let's inspire change together
          </a>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Former Partners ──────────────────────────────────────────────────────────

function FormerPartnersSection() {
  return (
    <section className="bg-[#070103] py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black mb-8">
            Former Partners of <span className="text-[#e62b1e]">TEDx</span>Clifton
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/proposal/page-08.jpg" alt="Former partners of TEDxClifton" className="block h-auto w-full select-none" draggable={false} />
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Theme: Next Is Now ───────────────────────────────────────────────────────

function ThemeSection() {
  return (
    <section className="bg-[#0a0102] py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]">TEDxClifton 3.0</div>
          <h2 className="font-display text-4xl font-black leading-tight md:text-5xl">
            Next Is Now —<br />Ideas Shaping the World<br className="hidden md:block" /> Before It Arrives
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-6 space-y-4 text-sm leading-relaxed text-white/65">
          <p>After redefining limits with Breaking Boundaries and shifting perspectives with The Other Side, TEDxClifton returns with its most urgent and future-driven edition yet.</p>
          <p>TEDxClifton 3.0: Next Is Now is a call to recognize that the future is no longer distant, theoretical, or "coming soon." It is unfolding right now — in our cities, our technologies, our identities, and our choices.</p>
          <p>This edition is about the people who aren't waiting for tomorrow. The builders, thinkers, and disruptors who are already living in what the world still calls "next."</p>
        </Reveal>

        <Reveal delay={0.15} className="mt-12">
          <h3 className="font-display text-2xl font-black mb-6">
            What <span className="text-[#e62b1e]">"Next Is Now"</span> Means
          </h3>
          <StaggerList
            items={[
              "AI is rewriting intelligence.",
              "Climate innovation is redefining survival.",
              "Creators are becoming institutions.",
              "Communities are becoming movements.",
            ]}
          />
        </Reveal>

        <Reveal delay={0.2} className="mt-10">
          <blockquote className="border-l-2 border-[#e62b1e] pl-6 italic text-white/50 leading-relaxed text-sm">
            "Next Is Now" is about ideas that are no longer predictions — they are active forces shaping how we live, work, heal, connect, and lead today. The future belongs to those acting now.
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Why This Matters Now ─────────────────────────────────────────────────────

function WhyMattersSection() {
  return (
    <section className="bg-[#070103] py-24 px-6">
      <div className="mx-auto max-w-3xl space-y-16">
        <div>
          <Reveal>
            <h2 className="font-display text-4xl font-black">
              Why This <span className="text-[#e62b1e]">Matters</span> Now
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-5 space-y-3 text-sm leading-relaxed text-white/65">
            <p>The world doesn't change in decades anymore — it changes in moments. In a time of rapid disruption and constant reinvention, waiting is no longer neutral; it's a risk.</p>
            <p>TEDxClifton 3.0 is about readiness, responsibility, and radical imagination grounded in action.</p>
          </Reveal>
        </div>

        <div>
          <Reveal>
            <h3 className="font-display text-2xl font-black text-[#e62b1e] mb-6">What the World Said About Our Last Event</h3>
          </Reveal>
          <StaggerList
            delay={0.05}
            items={[
              "10–20 bold, future-shaping talks across AI, innovation, sustainability, identity, science, creativity, and human potential",
              "A space designed to feel like the future unfolding — immersive, dynamic, and experiential",
              "Live performances and installations that merge technology, art, and human expression",
              "A curated audience of founders, researchers, policymakers, creatives, technologists, and next-gen leaders",
              "Global-standard TEDx storytelling — sharp, inspiring, and idea-driven",
            ]}
          />
        </div>

        <div>
          <Reveal>
            <h3 className="font-display text-2xl font-black text-[#e62b1e] mb-6">Voices We're Looking For</h3>
          </Reveal>
          <StaggerList
            items={[
              "The innovator building tomorrow's solutions today",
              "The technologist humanizing the future of intelligence",
              "The founder redefining systems that no longer serve us",
              "The scientist challenging how we think about progress",
              "The creator turning emerging tools into cultural shifts",
              "The everyday visionary quietly shaping what's next",
            ]}
          />
        </div>

        <Reveal>
          <div className="rounded-2xl border border-[#e62b1e]/25 bg-[#e62b1e]/5 p-8">
            <h3 className="font-display text-2xl font-black mb-3">
              The <span className="text-[#e62b1e]">Legacy</span> Continues
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">After previous editions positioned TEDxClifton among the most impactful TEDx experiences globally, 3.0 is not an upgrade — it's an acceleration. This is where future narratives are not announced; they are experienced.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Why Partner ──────────────────────────────────────────────────────────────

function WhyPartnerSection() {
  const reasons = [
    { title: "Global Reach of TEDx", body: "Connects innovators, creators, and thought-leaders worldwide." },
    { title: "42M YouTube Subscribers", body: "Reaching a global online audience of 500M+ views annually." },
    { title: "2000+ Attendees", body: "Direct connection with a diverse, engaged in-person audience." },
    { title: "University Marketing", body: "Targeted at young, dynamic students across Karachi's universities." },
    { title: "Social Media Promotion", body: "Brand showcased across all platforms before, during, and after." },
    { title: "Branding on Goodies", body: "Logo on shirts, diaries, pens, shields, and event giveaways." },
    { title: "Media Wall Branding", body: "Exposure to attendees, press, and photographers." },
    { title: "News Coverage", body: "Extensive visibility through our media partner network." },
    { title: "2000+ TEDx Chapters", body: "Partnership extends beyond Karachi to a global community." },
  ];

  return (
    <section className="bg-[#0a0102] py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-3xl font-black leading-tight md:text-4xl">
            Why Partner with <span className="text-[#e62b1e]">TEDx</span>Clifton 3.0?
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -5, borderColor: "rgba(230,43,30,0.4)", backgroundColor: "rgba(230,43,30,0.05)" }}
                className="group cursor-default rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all duration-300"
              >
                <div className="text-sm font-bold text-white mb-1.5 group-hover:text-[#e62b1e] transition-colors duration-300">{r.title}</div>
                <div className="text-xs text-white/45 leading-relaxed">{r.body}</div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Targeted Audience – donut chart ─────────────────────────────────────────

const AUDIENCE = [
  { label: "Professionals", pct: 40, color: "#c8c8c8" },
  { label: "Undergraduates", pct: 35, color: "#e62b1e" },
  { label: "CEO's", pct: 15, color: "#ff5f5f" },
  { label: "Special Guest", pct: 10, color: "#5c1010" },
];

function DonutChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-20% 0px" });

  const cx = 100, cy = 100, r = 68;
  const circ = 2 * Math.PI * r;
  let cum = 0;
  const segments = AUDIENCE.map((a) => {
    const dash = (a.pct / 100) * circ;
    const offset = -(cum / 100) * circ;
    cum += a.pct;
    return { ...a, dash, offset };
  });

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-10 md:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff12" strokeWidth={26} />
          {segments.map((seg, i) => (
            <motion.circle
              key={seg.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={26}
              strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
              strokeDashoffset={seg.offset}
              initial={{ opacity: 0, strokeDasharray: `0 ${circ}` }}
              animate={inView ? { opacity: 1, strokeDasharray: `${seg.dash} ${circ - seg.dash}` } : {}}
              transition={{ delay: i * 0.2 + 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="font-display text-2xl font-black text-white">2000+</div>
          <div className="text-[10px] uppercase tracking-widest text-white/35">Expected</div>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-5">
        {AUDIENCE.map((a, i) => (
          <Reveal key={a.label} delay={i * 0.1}>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: a.color }} />
              <div>
                <div className="font-display text-2xl font-black text-white">{a.pct}%</div>
                <div className="text-xs text-white/45">{a.label}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function AudienceSection() {
  return (
    <section className="bg-[#070103] py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black mb-12">
            Our Targeted <span className="text-[#e62b1e]">Audience</span>
          </h2>
        </Reveal>
        <DonutChart />
      </div>
    </section>
  );
}

// ─── Team ─────────────────────────────────────────────────────────────────────

function TeamSection() {
  return (
    <section className="bg-[#0a0102] py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black mb-8">
            Team Behind <span className="text-[#e62b1e]">TED</span>xClifton
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/proposal/page-13.jpg" alt="Team behind TEDxClifton" className="block h-auto w-full select-none" draggable={false} />
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Sponsorship Tiers ────────────────────────────────────────────────────────

const TIERS = [
  {
    name: "Title",
    accent: "Partner",
    price: "2,500,000 PKR",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.15)",
    benefits: [
      "Exclusive branded Networking Lounge in the venue",
      "Custom setup: standees, backdrops, digital displays",
      "Hospitality add-ons (coffee, refreshments)",
      "Staff presence to network, pitch, and connect",
      "Interactive branding & giveaway opportunities",
      "Featured in official networking schedule",
      "Logo/Name in all PR & promotional materials",
      "Verbal recognition by hosts at the event",
      "Logo on stage backdrops, banners & screens",
      "Logo integration in post-event videos",
      "10 Complimentary Tickets",
    ],
  },
  {
    name: "Gold",
    accent: "Sponsor",
    price: "2,000,000 PKR",
    color: "#FFD700",
    glow: "rgba(255,215,0,0.14)",
    benefits: [
      "Presenting Partner — official event named after your brand",
      "Brand in all marketing, press releases & digital content",
      "Session naming rights & co-sponsorship exclusive titles",
      "On-ground branded experience zone",
      "\"[Your Brand] Innovation Spotlight\" session",
      "Awards & shields presented under your brand name",
      "Logo on all event merchandise",
      "Brand in official pre & post-event videos",
      "6 VIP Complimentary Tickets",
    ],
  },
  {
    name: "Silver",
    accent: "Sponsor",
    price: "1,500,000 PKR",
    color: "#C0C0C0",
    glow: "rgba(192,192,192,0.12)",
    benefits: [
      "Speaker slot — engage directly with the audience",
      "Logo/Name recognition on event website",
      "Logo/Name in all PR & promotional materials",
      "Full-page ad in event program",
      "Verbal recognition at the event",
      "Logo on event videos (pre, during & post)",
      "6 Complimentary Event Tickets",
      "Networking Hub exhibit booth space",
      "Branding on event goodies (shirts, diaries, pens)",
    ],
  },
  {
    name: "Bronze",
    accent: "Sponsor",
    price: "1,000,000 PKR",
    color: "#CD7F32",
    glow: "rgba(205,127,50,0.12)",
    benefits: [
      "Logo/Name recognition on website",
      "Name recognition in PR materials",
      "Half-page ad in event program",
      "Verbal recognition at the event",
      "Logo recognition at the event",
      "Name recognition on event videos",
      "4 Complimentary Event Tickets",
      "Networking Hub exhibit booth space",
      "Branding on event goodies",
    ],
  },
];

function TierCard({ tier, index }: { tier: (typeof TIERS)[number]; index: number }) {
  return (
    <Reveal delay={index * 0.1}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.35 }}
        style={{ borderColor: `${tier.color}28` }}
        className="group relative overflow-hidden rounded-2xl border bg-[#0c0102] p-8"
      >
        {/* glow blob */}
        <motion.div
          initial={{ opacity: 0.2 }}
          whileHover={{ opacity: 0.55 }}
          transition={{ duration: 0.4 }}
          style={{ backgroundColor: tier.color }}
          className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full blur-[60px]"
        />

        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h3 className="font-display text-3xl font-black" style={{ color: tier.color }}>
              {tier.name} <span className="text-white">{tier.accent}</span>
            </h3>
            <span className="rounded-full border px-4 py-1.5 text-sm font-bold" style={{ borderColor: `${tier.color}40`, color: tier.color }}>
              {tier.price}
            </span>
          </div>

          <ul className="mt-6 space-y-2.5">
            {tier.benefits.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="flex items-start gap-2.5 text-sm text-white/60"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tier.color }} />
                {b}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </Reveal>
  );
}

function TiersSection() {
  const inKindItems = [
    "Beverages", "Catered Food", "Equipment Rental",
    "Exhibits / Product Demos", "Gift Bag Items for Attendees",
    "Gift Bag Items for Speakers & Guests", "Giveaway",
    "Printing Material", "Snack", "Stage Design", "Team Shirts",
  ];

  return (
    <section className="bg-[#070103] py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black mb-2">
            Sponsorship <span className="text-[#e62b1e]">Packages</span>
          </h2>
          <p className="text-white/40 text-sm mb-12">Choose the partnership level that best aligns with your brand goals.</p>
        </Reveal>

        <div className="space-y-6">
          {TIERS.map((tier, i) => (
            <TierCard key={tier.name} tier={tier} index={i} />
          ))}
        </div>

        {/* In-Kind */}
        <Reveal delay={0.1} className="mt-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <h3 className="font-display text-2xl font-black mb-1">
              In-Kind <span className="text-[#e62b1e]">Sponsor</span>
            </h3>
            <h4 className="font-display text-lg font-black text-white/60 mb-4">Venue Rent Sponsor</h4>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">Support TEDxClifton through in-kind contributions. Benefits packages can be customized based on the relative value of your gift.</p>
            <div className="flex flex-wrap gap-2">
              {inKindItems.map((item, i) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ borderColor: "rgba(230,43,30,0.5)", color: "#ffffff" }}
                  className="cursor-default rounded-full border border-white/12 px-3.5 py-1.5 text-xs text-white/50 transition-colors duration-200"
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Agreement ────────────────────────────────────────────────────────────────

const TIER_OPTIONS = [
  { label: "Platinum Sponsor", price: "2,500,000 PKR" },
  { label: "Gold Sponsor", price: "2,000,000 PKR" },
  { label: "Silver Sponsor", price: "1,500,000 PKR" },
  { label: "Bronze Sponsor", price: "1,000,000 PKR" },
];

function AgreementSection() {
  return (
    <section className="bg-[#0a0102] py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black">
            Sponsorship <span className="text-[#e62b1e]">Agreement</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-4 space-y-3 text-sm text-white/55 leading-relaxed">
          <p>Payment is required in full before activation. TEDx retains full discretion in selecting the main theme, speakers, topics, structure, and participants. All partnership funds go back into the production of the event — TEDx events are non-profit.</p>
          <p>This document acts as a good faith agreement between the parties to cooperate in making TEDx and the partnership a success.</p>
        </Reveal>

        <Reveal delay={0.15} className="mt-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-8">
            {/* tier selection */}
            <div>
              <p className="text-sm font-semibold text-white/70 mb-4">Sponsorship Level</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TIER_OPTIONS.map((t) => (
                  <label
                    key={t.label}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-4 transition-all duration-200 hover:border-[#e62b1e]/40 hover:bg-[#e62b1e]/5 group"
                  >
                    <input type="radio" name="tier" className="accent-[#e62b1e]" />
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-[#e62b1e] transition-colors">{t.label}</div>
                      <div className="text-xs text-white/35">{t.price}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* payment method */}
            <div>
              <p className="text-sm font-semibold text-white/70 mb-3">Preferred Payment</p>
              <div className="space-y-2.5">
                {["Via check (payable to: TEDx)", "Via Online Bank Transfer"].map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-3 text-sm text-white/55 hover:text-white/80 transition-colors">
                    <input type="radio" name="payment" className="accent-[#e62b1e]" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            {/* fields */}
            <div className="space-y-4 border-t border-white/10 pt-6">
              {["Sponsoring Company / Organization", "Contact Name", "Contact Title"].map((field) => (
                <div key={field}>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">{field}</label>
                  <input
                    type="text"
                    placeholder={field}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-[#e62b1e]/50 focus:outline-none focus:ring-1 focus:ring-[#e62b1e]/30"
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function ContactSection() {
  return (
    <section className="bg-[#070103] py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-black mb-10">
            Contact <span className="text-[#e62b1e]">Details</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <motion.div
            whileHover={{ borderColor: "rgba(230,43,30,0.4)", boxShadow: "0 28px_70px rgba(230,43,30,0.1)" }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-10 transition-all duration-500"
          >
            <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 translate-x-16 -translate-y-16 rounded-full bg-[#e62b1e]/12 blur-[80px]" />
            <div className="relative z-10">
              <div className="font-display text-2xl font-black text-white">Syed Wajid Hussain Shah</div>
              <div className="mt-1 text-sm font-medium text-[#e62b1e]">Lead Organizer, TEDxClifton</div>
              <div className="mt-6 space-y-3">
                {["tedxcliftonkarachi@gmail.com", "syed.hussain.ethical@gmail.com"].map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="group flex items-center gap-3 text-sm text-white/55 transition-colors hover:text-white"
                  >
                    <Mail size={14} className="shrink-0 text-[#e62b1e]" />
                    <span>{email}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function ProposalViewer() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const [busy, setBusy] = useState(false);

  async function downloadPdf() {
    if (busy) return;
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      let added = 0;
      for (const page of PROPOSAL_PAGES) {
        const dataUrl = await fetchAsDataURL(page.src);
        if (!dataUrl) continue;
        const fmt = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        if (added > 0) doc.addPage();
        doc.addImage(dataUrl, fmt, 0, 0, w, h, undefined, "FAST");
        added++;
      }
      if (added === 0) { alert("No pages found."); return; }
      doc.save(PROPOSAL_PDF_NAME);
    } catch (e) {
      console.error(e);
      alert("Couldn't generate the PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    await fetch("/api/proposal/unlock", { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#070103] text-white">
      {/* scroll progress bar */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left bg-gradient-to-r from-[#e62b1e] via-rose-400 to-[#e62b1e]"
      />

      {/* sticky header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <div className="font-display text-base font-bold leading-none tracking-tight">
              <span className="text-[#e62b1e]">TED</span>
              <span className="text-[#e62b1e] text-xs align-super">x</span>
              <span className="text-white"> Clifton</span>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/40">Sponsorship Proposal</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPdf}
              disabled={busy}
              className="flex items-center gap-2 rounded-full bg-[#e62b1e] px-4 py-2 text-sm font-bold text-white hover:bg-[#c41e13] disabled:opacity-60 transition-colors"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span className="hidden sm:inline">{busy ? "Preparing…" : "Download PDF"}</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={lock}
              title="Lock proposal"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/30 hover:text-white"
            >
              <Lock size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />
        <AboutSection />
        <LastEventSection />
        <PhotoCollageSection />
        <SpeakersSection version="1.0" imgSrc="/proposal/page-05.jpg" />
        <SpeakersSection version="2.0" imgSrc="/proposal/page-06.jpg" />
        <BecomeASponsorSection />
        <FormerPartnersSection />
        <ThemeSection />
        <WhyMattersSection />
        <WhyPartnerSection />
        <AudienceSection />
        <TeamSection />
        <TiersSection />
        <AgreementSection />
        <ContactSection />

        <footer className="border-t border-white/10 bg-[#070103] py-10 px-6 text-center">
          <div className="font-display text-lg font-bold">
            Next is <span className="text-[#e62b1e]">Now</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-white/30">
            TEDxClifton · Clifton, Karachi
          </p>
        </footer>
      </main>
    </div>
  );
}
