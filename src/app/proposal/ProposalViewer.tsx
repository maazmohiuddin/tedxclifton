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
  useMotionValue,
} from "framer-motion";
import { Download, Lock, Loader2, Mail, ArrowRight } from "lucide-react";
import { PROPOSAL_PDF_NAME, PROPOSAL_PAGES } from "./pages";

// ─── Data URL helper ──────────────────────────────────────────────────────────

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

// ─── Cursor glow (direct DOM mutation — no re-renders) ────────────────────────

function CursorGlow() {
  const divRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const el = divRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      el.style.background = `radial-gradient(520px circle at ${e.clientX}px ${e.clientY}px, rgba(230,43,30,0.055), transparent 60%)`;
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [reduced]);
  if (reduced) return null;
  return <div ref={divRef} aria-hidden className="pointer-events-none fixed inset-0 z-20" />;
}

// ─── Word-by-word headline ────────────────────────────────────────────────────

function AnimatedWords({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const reduced = useReducedMotion();
  const words = text.split(" ");
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden leading-[1.15]">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: "110%", opacity: 0 }}
            animate={inView ? { y: "0%", opacity: 1 } : {}}
            transition={{ duration: 0.72, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

// ─── CountUp ──────────────────────────────────────────────────────────────────

function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1.8,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const [count, setCount] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduced) { setCount(to); return; }
    let frame = 0;
    const totalFrames = Math.round(duration * 60);
    const timer = setInterval(() => {
      frame++;
      const eased = frame >= totalFrames ? 1 : 1 - Math.pow(2, -10 * (frame / totalFrames));
      setCount(Math.round(eased * to));
      if (frame >= totalFrames) clearInterval(timer);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, to, duration, reduced]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

// ─── Mouse-tracking glow card (direct DOM mutation) ──────────────────────────

function GlowCard({
  children,
  className = "",
  color = "rgba(230,43,30,0.13)",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect();
    const glow = glowRef.current;
    if (!rect || !glow) return;
    glow.style.background = `radial-gradient(240px circle at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, ${color}, transparent 70%)`;
    glow.style.opacity = "1";
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={() => { if (glowRef.current) glowRef.current.style.opacity = "0"; }}
      className={`relative ${className}`}
      style={style}
    >
      <div ref={glowRef} aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300" />
      {children}
    </div>
  );
}

// ─── 3-D tilt card ────────────────────────────────────────────────────────────

function TiltCard({
  children,
  className = "",
  intensity = 8,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springRotX = useSpring(rotX, { stiffness: 260, damping: 26 });
  const springRotY = useSpring(rotY, { stiffness: 260, damping: 26 });
  const reduced = useReducedMotion();

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rotX.set(((e.clientY - rect.top - rect.height / 2) / rect.height) * -intensity);
    rotY.set(((e.clientX - rect.left - rect.width / 2) / rect.width) * intensity);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => { rotX.set(0); rotY.set(0); }}
      style={{ rotateX: springRotX, rotateY: springRotY, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Reveal ───────────────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right" | "scale" | "none";
}) {
  const reduced = useReducedMotion();
  const initial =
    reduced || direction === "none"
      ? { opacity: 0 }
      : direction === "up"
      ? { opacity: 0, y: 32 }
      : direction === "left"
      ? { opacity: 0, x: -32 }
      : direction === "right"
      ? { opacity: 0, x: 32 }
      : { opacity: 0, scale: 0.93 };

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger list ─────────────────────────────────────────────────────────────

function StaggerList({ items, delay = 0 }: { items: string[]; delay?: number }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: delay + i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start gap-3 text-sm text-white/65 leading-relaxed"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e62b1e]" />
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

// ─── Shimmer CTA ──────────────────────────────────────────────────────────────

function ShimmerButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#e62b1e] px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_40px_rgba(230,43,30,0.4)]"
    >
      <motion.span
        aria-hidden
        initial={{ x: "-200%" }}
        animate={{ x: "200%" }}
        transition={{ repeat: Infinity, repeatDelay: 2.5, duration: 0.85, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-y-0 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      {children}
    </motion.a>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-2">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="h-px bg-gradient-to-r from-transparent via-[#e62b1e]/35 to-transparent origin-left"
      />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "32%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.72], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);

  // deterministic particles — no hydration mismatch
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: ((i * 6.3) % 88) + 6,
    y: ((i * 11.7) % 84) + 8,
    size: (i % 3) + 1,
    dur: 4 + (i % 5),
    delay: i * 0.35,
  }));

  return (
    <section ref={ref} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070103]">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.14, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e62b1e] blur-[150px]"
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -25, 0] }}
          transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
          className="absolute right-1/4 top-1/4 h-[260px] w-[260px] rounded-full bg-[#e62b1e]/5 blur-[90px]"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 11, ease: "easeInOut", delay: 2 }}
          className="absolute left-1/4 bottom-1/4 h-[200px] w-[200px] rounded-full bg-rose-900/15 blur-[80px]"
        />
      </div>

      {/* floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-[#e62b1e]/60"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [0, -20, 0], opacity: [0.25, 0.75, 0.25] }}
            transition={{ repeat: Infinity, duration: p.dur, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      <motion.div style={{ y, opacity, scale }} className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="font-display text-3xl tracking-tight">
            <span className="text-[#e62b1e] font-black">TED</span><span className="text-[#e62b1e] font-black text-lg align-super">x</span><span className="text-white font-light"> Clifton</span>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="mt-1.5 text-[11px] tracking-[0.3em] text-white/35 uppercase"
          >
            x = independently organized TED event
          </motion.div>
        </motion.div>

        <h1 className="font-display font-black leading-[0.92] tracking-tight" style={{ fontSize: "clamp(3.5rem,13vw,9rem)" }}>
          <AnimatedWords text="Next is" className="text-white" delay={0.4} />
          {" "}
          <AnimatedWords text="Now" className="text-[#e62b1e] italic" delay={0.7} />
        </h1>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 h-px w-24 bg-gradient-to-r from-transparent via-[#e62b1e] to-transparent origin-center"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.25 }}
          className="mt-5 text-base font-semibold uppercase tracking-[0.35em] text-white/50"
        >
          Sponsorship Proposal
        </motion.p>

        {/* X watermark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -6 }}
          animate={{ opacity: 0.08, scale: 1, rotate: 0 }}
          transition={{ duration: 1.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 select-none font-black leading-none"
          style={{ fontSize: "clamp(220px,55vw,480px)", WebkitTextStroke: "3px #e62b1e", color: "transparent" }}
        >
          X
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25"
      >
        <span className="text-[9px] uppercase tracking-[0.35em]">Scroll</span>
        <motion.div
          animate={{ scaleY: [1, 1.8, 1], opacity: [0.35, 1, 0.35] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="h-8 w-px bg-gradient-to-b from-[#e62b1e]/70 to-transparent origin-top"
        />
      </motion.div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

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
      <div className="flex items-end justify-between gap-3" style={{ height: 180 }}>
        {SOCIAL_STATS.map((s, i) => (
          <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12 + 0.4 }}
              className="text-xs font-black text-white"
            >
              {s.value}M
            </motion.span>
            <div className="relative w-full rounded-t overflow-hidden" style={{ height: `${(s.value / max) * 140}px` }}>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{ delay: i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ originY: 1 }}
                className="absolute inset-0 rounded-t bg-gradient-to-t from-[#c41e13] to-[#ff4433]"
              />
              {/* flash */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: [0, 0.5, 0] } : {}}
                transition={{ delay: i * 0.1 + 0.95, duration: 0.55 }}
                className="absolute inset-0 rounded-t bg-white/30"
              />
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.12 + 0.65 }}
              className="text-[10px] text-white/45 text-center leading-tight"
            >
              {s.label}
            </motion.span>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mt-2 h-px w-full bg-white/10 origin-left"
      />
    </div>
  );
}

function AboutSection() {
  return (
    <section className="bg-[#0a0102] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]"
        >
          The Movement
        </motion.div>
        <h2 className="font-display text-4xl font-black md:text-5xl">
          <AnimatedWords text="About TEDx" />
        </h2>
        <Reveal delay={0.12} className="mt-7 space-y-4 text-sm leading-relaxed text-white/65">
          <p>TED (Technology, Entertainment, Design) is a nonprofit organization devoted to Ideas Worth Spreading. Started as a four-day conference in California 30 years ago, TED has grown into a worldwide movement known for its two annual TED Conferences, where the world's leading thinkers and doers are invited to speak for 18 minutes or less.</p>
          <p>The annual TED Conference takes place each spring in Vancouver, British Columbia. TED's media initiatives include TED.com, where new TED Talks are posted daily; TED Translators, which provides subtitles and interactive transcripts; and the educational initiative TED-Ed.</p>
          <p>TED has established The Audacious Project — a collaborative approach to funding ideas at thrilling scale. TEDx supports individuals or groups in hosting local, self-organized TED-style events around the world, and the TED Fellows program helps world-changing innovators amplify their impact.</p>
        </Reveal>
        <Reveal delay={0.22} className="mt-12">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/35">Global Digital Reach</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-[#e62b1e]"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
          <BarChart />
        </Reveal>
      </div>
    </section>
  );
}

// ─── Last Event ───────────────────────────────────────────────────────────────

function LastEventSection() {
  const stats = [
    { to: 1000, suffix: "+", label: "Attendees" },
    { to: 200, suffix: "+", label: "CEOs & Leaders" },
    { to: 10, suffix: "+", label: "Speakers" },
    { to: 1, prefix: "#", suffix: "", label: "In Pakistan" },
  ];

  return (
    <section className="bg-[#070103] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]">
          Breaking Boundaries
        </motion.div>
        <h2 className="font-display text-4xl font-black md:text-5xl">
          <AnimatedWords text="Our Last Event" />
        </h2>
        <Reveal delay={0.06} className="mt-2 text-sm font-medium text-white/40 tracking-wide">
          TEDxClifton Karachi: Breaking Boundaries — A Landmark Event in Pakistan's TEDx History
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.09} direction="scale">
              <TiltCard>
                <GlowCard className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center cursor-default h-full">
                  <div className="font-display text-3xl font-black text-[#e62b1e]">
                    <CountUp to={s.to} prefix={s.prefix ?? ""} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">{s.label}</div>
                </GlowCard>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="mt-9 space-y-4 text-sm leading-relaxed text-white/65">
          <p>On February 25th, TEDxClifton Karachi hosted one of the most successful and impactful TEDx events ever held in Pakistan, centered around the powerful theme: <em className="text-white/80 not-italic font-semibold">"Breaking Boundaries"</em>.</p>
          <p>One of our international speakers — a former official TED speaker — publicly compared TEDxClifton Karachi to some of the most prestigious TED events in the United States, calling it <em className="text-white/80 not-italic">"a globally competitive TEDx experience that sets a new benchmark for Pakistan."</em></p>
        </Reveal>

        <Reveal delay={0.22} className="mt-8">
          <motion.blockquote
            whileHover={{ x: 5, borderLeftColor: "rgba(230,43,30,0.8)" }}
            transition={{ duration: 0.3 }}
            className="border-l-2 border-[#e62b1e]/40 pl-6 italic text-white/50 leading-relaxed text-sm transition-colors duration-300"
          >
            "Guests and speakers applauded the meticulous organization, the diversity and depth of the talks, the electrifying energy of the crowd, and the vision of the team behind it all."
          </motion.blockquote>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Photo Collage ────────────────────────────────────────────────────────────

function PhotoCollageSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section ref={ref} className="bg-[#0a0102] py-20 px-6 overflow-hidden">
      <Reveal className="mx-auto max-w-3xl">
        <motion.div
          whileHover={{ scale: 1.012 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)]"
        >
          <motion.div style={{ y }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/proposal/page-04.jpg" alt="TEDxClifton Breaking Boundaries event photos"
              className="block h-auto w-full select-none scale-[1.1]" draggable={false} />
          </motion.div>
        </motion.div>
      </Reveal>
    </section>
  );
}

// ─── Speakers ─────────────────────────────────────────────────────────────────

const V1_SPEAKERS = [
  { file: "Dr. Affan Qaisar.png", name: "Dr. Affan Qaisar" },
  { file: "Dr. Ahson.png", name: "Dr. Ahson" },
  { file: "Erica Robin.png", name: "Erica Robin" },
  { file: "Habib Elahi.png", name: "Habib Elahi" },
  { file: "Huma Rehan Mirza.png", name: "Huma Rehan Mirza" },
  { file: "Karim Teli.png", name: "Karim Teli" },
  { file: "Mehwish Ali.png", name: "Mehwish Ali" },
  { file: "Muhammad Shari Waqar.png", name: "Muhammad Shari Waqar" },
  { file: "Noman Siddique.png", name: "Noman Siddique" },
  { file: "Rabeel Warraich.png", name: "Rabeel Warraich" },
  { file: "Saad Allahwala.png", name: "Saad Allahwala" },
  { file: "Saif Ali.png", name: "Saif Ali" },
  { file: "Sara Gill.png", name: "Sara Gill" },
  { file: "Syed Zafar Abbas.png", name: "Syed Zafar Abbas" },
  { file: "Umair Masoom.png", name: "Umair Masoom" },
  { file: "Wasif Khan.png", name: "Wasif Khan" },
];

const V2_SPEAKERS = [
  { file: "Ali Khjan.png", name: "Ali Khan" },
  { file: "Brig. Tarique Lakhiar.png", name: "Brig. Tarique Lakhiar" },
  { file: "Hamza Ibrahim.png", name: "Hamza Ibrahim" },
  { file: "Humna Altamash.png", name: "Humna Altamash" },
  { file: "Iqbal Sheikh.png", name: "Iqbal Sheikh" },
  { file: "Khushnood Aftab.png", name: "Khushnood Aftab" },
  { file: "Maryam Ali.png", name: "Maryam Ali" },
  { file: "Mehboob Shae.png", name: "Mehboob Shar" },
  { file: "Muddabir Ali.png", name: "Muddabir Ali" },
  { file: "Muhammad Waqas.png", name: "Muhammad Waqas" },
  { file: "Nusair Teli.png", name: "Nusair Teli" },
  { file: "Oliver Benette.png", name: "Oliver Bennett" },
  { file: "Sara Ali.png", name: "Sara Ali" },
  { file: "Zonash Warraich.png", name: "Zonash Warraich" },
];

function SpeakerBadge({ file, name, folder, index }: { file: string; name: string; folder: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.87 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ delay: index * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.08 }}
      className="flex flex-col items-center justify-end gap-2 cursor-default group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/Speaker/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`}
        alt={name}
        className="w-24 h-auto select-none transition-all duration-500 group-hover:drop-shadow-[0_0_22px_rgba(230,43,30,0.55)]"
        draggable={false}
      />
      <p className="text-center text-[10px] font-bold leading-tight text-white/65 max-w-[96px] group-hover:text-white transition-colors duration-300">
        {name}
      </p>
    </motion.div>
  );
}

function SpeakersSection({ version, speakers, folder, bg }: { version: string; speakers: typeof V1_SPEAKERS; folder: string; bg: string }) {
  return (
    <section className={`${bg} py-28 px-6 overflow-hidden`}>
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="mb-2 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]">
          Breaking Boundaries
        </motion.div>
        <h2 className="font-display text-4xl font-black mb-14 md:text-5xl">
          <AnimatedWords text={`TEDxClifton ${version} Speakers`} />
        </h2>
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center select-none font-black leading-none"
            style={{ fontSize: "clamp(220px,50vw,420px)", WebkitTextStroke: "2px rgba(230,43,30,0.09)", color: "transparent" }}>
            X
          </div>
          <div className="relative z-10 flex flex-wrap justify-center gap-8 items-end">
            {speakers.map((s, i) => (
              <SpeakerBadge key={s.file} {...s} folder={folder} index={i} />
            ))}
          </div>
        </div>
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
    <section className="bg-[#0a0102] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]">
          Partnership
        </motion.div>
        <h2 className="font-display text-4xl font-black leading-tight md:text-5xl">
          <AnimatedWords text="Become a Sponsor" />
          <br />
          <AnimatedWords text="for TEDxClifton 3.0" delay={0.22} className="text-[#e62b1e]" />
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {highlights.map((h, i) => (
            <Reveal key={h.label} delay={i * 0.09} direction="scale">
              <TiltCard>
                <GlowCard className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center h-full">
                  <motion.div
                    animate={{ rotate: [0, 6, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 4 + i, delay: i * 0.6, ease: "easeInOut" }}
                    className="text-3xl mb-3"
                  >
                    {h.icon}
                  </motion.div>
                  <div className="font-display text-xl font-black text-white">{h.label}</div>
                  <div className="mt-1 text-[11px] text-white/40">{h.desc}</div>
                </GlowCard>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10 space-y-4 text-sm leading-relaxed text-white/65">
          <p>TEDxClifton Karachi is seeking community sponsors to help bring our 2025 event to life. Partnering with us means connecting your brand with the global TED network while celebrating the unique, dynamic spirit of Karachi.</p>
          <p>Our event will bring together bold thinkers and curious minds eager to challenge the status quo. Sponsoring TEDxClifton Karachi offers a chance to support innovation, amplify your brand, and engage with a passionate local and global audience.</p>
        </Reveal>

        <Reveal delay={0.28} className="mt-10">
          <ShimmerButton href="mailto:tedxcliftonkarachi@gmail.com">
            <Mail size={15} />
            Let&apos;s inspire change together
            <ArrowRight size={14} className="opacity-70" />
          </ShimmerButton>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Former Partners — single marquee ────────────────────────────────────────

const PARTNER_COUNT = 20;

function FormerPartnersSection() {
  return (
    <section className="bg-[#070103] py-28 overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 mb-12">
        <h2 className="font-display text-4xl font-black mb-3 md:text-5xl">
          <AnimatedWords text="Former Partners" />
        </h2>
        <Reveal delay={0.1}>
          <p className="text-sm text-white/40">Brands that believed in us before the world was watching.</p>
        </Reveal>
      </div>

      {/* single infinite marquee row */}
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        >
          {Array.from({ length: PARTNER_COUNT * 2 }, (_, i) => {
            const n = String((i % PARTNER_COUNT) + 1).padStart(2, "0");
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.07)" }}
                className="flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] px-5 py-3 ring-1 ring-white/8 transition-colors duration-300 cursor-default"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/partners-logos/partner-${n}.png`}
                  alt={`Partner ${(i % PARTNER_COUNT) + 1}`}
                  className="max-h-full max-w-full object-contain select-none"
                  draggable={false}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function ThemeSection() {
  return (
    <section className="bg-[#0a0102] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]">
          TEDxClifton 3.0
        </motion.div>
        <h2 className="font-display text-4xl font-black leading-tight md:text-5xl">
          <AnimatedWords text="Next Is Now —" />
          <br />
          <AnimatedWords text="Ideas Shaping the World" delay={0.28} />
          <br />
          <AnimatedWords text="Before It Arrives" delay={0.54} className="text-[#e62b1e]" />
        </h2>

        <Reveal delay={0.12} className="mt-9 space-y-4 text-sm leading-relaxed text-white/65">
          <p>After redefining limits with Breaking Boundaries and shifting perspectives with The Other Side, TEDxClifton returns with its most urgent and future-driven edition yet.</p>
          <p>TEDxClifton 3.0: Next Is Now is a call to recognize that the future is no longer distant, theoretical, or "coming soon." It is unfolding right now — in our cities, our technologies, our identities, and our choices.</p>
          <p>This edition is about the people who aren't waiting for tomorrow. The builders, thinkers, and disruptors who are already living in what the world still calls "next."</p>
        </Reveal>

        <Reveal delay={0.2} className="mt-14">
          <h3 className="font-display text-2xl font-black mb-6">What <span className="text-[#e62b1e]">"Next Is Now"</span> Means</h3>
          <StaggerList items={[
            "AI is rewriting intelligence.",
            "Climate innovation is redefining survival.",
            "Creators are becoming institutions.",
            "Communities are becoming movements.",
          ]} />
        </Reveal>

        <Reveal delay={0.28} className="mt-12">
          <motion.blockquote
            whileHover={{ x: 5 }}
            transition={{ duration: 0.3 }}
            className="relative border-l-2 border-[#e62b1e] pl-8 italic text-white/55 leading-relaxed text-[0.95rem]"
          >
            "Next Is Now" is about ideas that are no longer predictions — they are active forces shaping how we live, work, heal, connect, and lead today. The future belongs to those acting now.
          </motion.blockquote>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Why This Matters ─────────────────────────────────────────────────────────

function WhyMattersSection() {
  return (
    <section className="bg-[#070103] py-28 px-6">
      <div className="mx-auto max-w-3xl space-y-20">
        <div>
          <h2 className="font-display text-4xl font-black md:text-5xl">
            <AnimatedWords text="Why This Matters Now" />
          </h2>
          <Reveal delay={0.12} className="mt-6 space-y-3 text-sm leading-relaxed text-white/65">
            <p>The world doesn't change in decades anymore — it changes in moments. In a time of rapid disruption and constant reinvention, waiting is no longer neutral; it's a risk.</p>
            <p>TEDxClifton 3.0 is about readiness, responsibility, and radical imagination grounded in action.</p>
          </Reveal>
        </div>

        <div>
          <Reveal><h3 className="font-display text-2xl font-black text-[#e62b1e] mb-6">What the World Said About Our Last Event</h3></Reveal>
          <StaggerList delay={0.05} items={[
            "10–20 bold, future-shaping talks across AI, innovation, sustainability, identity, science, creativity, and human potential",
            "A space designed to feel like the future unfolding — immersive, dynamic, and experiential",
            "Live performances and installations that merge technology, art, and human expression",
            "A curated audience of founders, researchers, policymakers, creatives, technologists, and next-gen leaders",
            "Global-standard TEDx storytelling — sharp, inspiring, and idea-driven",
          ]} />
        </div>

        <div>
          <Reveal><h3 className="font-display text-2xl font-black text-[#e62b1e] mb-6">Voices We're Looking For</h3></Reveal>
          <StaggerList items={[
            "The innovator building tomorrow's solutions today",
            "The technologist humanizing the future of intelligence",
            "The founder redefining systems that no longer serve us",
            "The scientist challenging how we think about progress",
            "The creator turning emerging tools into cultural shifts",
            "The everyday visionary quietly shaping what's next",
          ]} />
        </div>

        <Reveal direction="scale">
          <GlowCard className="rounded-2xl border border-[#e62b1e]/25 bg-[#e62b1e]/5 p-8">
            <h3 className="font-display text-2xl font-black mb-3">The <span className="text-[#e62b1e]">Legacy</span> Continues</h3>
            <p className="text-sm text-white/60 leading-relaxed">After previous editions positioned TEDxClifton among the most impactful TEDx experiences globally, 3.0 is not an upgrade — it's an acceleration. This is where future narratives are not announced; they are experienced.</p>
          </GlowCard>
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
    <section className="bg-[#0a0102] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-3xl font-black leading-tight md:text-4xl">
          <AnimatedWords text="Why Partner with TEDxClifton 3.0?" />
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.06}>
              <TiltCard intensity={6}>
                <GlowCard className="group cursor-default rounded-xl border border-white/10 bg-white/[0.02] p-5 h-full transition-colors duration-300 hover:border-[#e62b1e]/30">
                  <motion.div
                    className="mb-2 h-0.5 w-6 rounded-full bg-[#e62b1e]/50 origin-left"
                    whileHover={{ scaleX: 1.8, backgroundColor: "#e62b1e" }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="text-sm font-bold text-white mb-1.5 group-hover:text-[#e62b1e] transition-colors duration-300">{r.title}</div>
                  <div className="text-xs text-white/45 leading-relaxed">{r.body}</div>
                </GlowCard>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Audience donut ───────────────────────────────────────────────────────────

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
    <div ref={containerRef} className="flex flex-col items-center gap-12 md:flex-row">
      <div className="relative h-56 w-56 shrink-0">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff10" strokeWidth={28} />
          {segments.map((seg, i) => (
            <motion.circle key={seg.label} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={28}
              strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
              strokeDashoffset={seg.offset}
              initial={{ opacity: 0, strokeDasharray: `0 ${circ}` }}
              animate={inView ? { opacity: 1, strokeDasharray: `${seg.dash} ${circ - seg.dash}` } : {}}
              transition={{ delay: i * 0.2 + 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="font-display text-2xl font-black text-white">
            <CountUp to={2000} suffix="+" duration={2.2} />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/35">Expected</div>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-6">
        {AUDIENCE.map((a, i) => (
          <Reveal key={a.label} delay={i * 0.1} direction="left">
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
    <section className="bg-[#070103] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-4xl font-black mb-14 md:text-5xl">
          <AnimatedWords text="Our Targeted" />{" "}
          <AnimatedWords text="Audience" className="text-[#e62b1e]" delay={0.28} />
        </h2>
        <DonutChart />
      </div>
    </section>
  );
}

// ─── Team ─────────────────────────────────────────────────────────────────────

function TeamSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <section ref={ref} className="bg-[#0a0102] py-24 px-6 overflow-hidden">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-4xl font-black mb-10 md:text-5xl">
          <AnimatedWords text="Team Behind" />{" "}
          <AnimatedWords text="TEDxClifton" className="text-[#e62b1e]" delay={0.22} />
        </h2>
        <Reveal delay={0.1}>
          <motion.div
            whileHover={{ scale: 1.008 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)]"
          >
            <motion.div style={{ y }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/proposal/page-13.jpg" alt="Team behind TEDxClifton"
                className="block h-auto w-full select-none scale-[1.1]" draggable={false} />
            </motion.div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: "Title", accent: "Partner", price: "2,500,000 PKR", color: "#a78bfa", glow: "rgba(167,139,250,0.14)",
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
    name: "Gold", accent: "Sponsor", price: "2,000,000 PKR", color: "#FFD700", glow: "rgba(255,215,0,0.13)",
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
    name: "Silver", accent: "Sponsor", price: "1,500,000 PKR", color: "#C0C0C0", glow: "rgba(192,192,192,0.11)",
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
    name: "Bronze", accent: "Sponsor", price: "1,000,000 PKR", color: "#CD7F32", glow: "rgba(205,127,50,0.11)",
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
      <TiltCard intensity={4}>
        <GlowCard
          color={tier.glow}
          className="group relative overflow-hidden rounded-2xl border bg-[#0c0102] p-8"
          style={{ borderColor: `${tier.color}28` }}
        >
          <motion.div
            initial={{ opacity: 0.14 }}
            whileHover={{ opacity: 0.5, scale: 1.2 }}
            transition={{ duration: 0.5 }}
            style={{ backgroundColor: tier.color }}
            className="pointer-events-none absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full blur-[70px]"
          />
          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h3 className="font-display text-3xl font-black" style={{ color: tier.color }}>
                {tier.name} <span className="text-white">{tier.accent}</span>
              </h3>
              <motion.span whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}
                className="rounded-full border px-4 py-1.5 text-sm font-bold"
                style={{ borderColor: `${tier.color}40`, color: tier.color }}>
                {tier.price}
              </motion.span>
            </div>
            <ul className="mt-6 space-y-2.5">
              {tier.benefits.map((b, i) => (
                <motion.li key={b}
                  initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.45 }}
                  className="flex items-start gap-2.5 text-sm text-white/60"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tier.color }} />
                  {b}
                </motion.li>
              ))}
            </ul>
          </div>
        </GlowCard>
      </TiltCard>
    </Reveal>
  );
}

function TiersSection() {
  const inKindItems = [
    "Beverages", "Catered Food", "Equipment Rental", "Exhibits / Product Demos",
    "Gift Bag Items for Attendees", "Gift Bag Items for Speakers & Guests", "Giveaway",
    "Printing Material", "Snack", "Stage Design", "Team Shirts",
  ];

  return (
    <section className="bg-[#070103] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]">
          Investment
        </motion.div>
        <h2 className="font-display text-4xl font-black mb-2 md:text-5xl">
          Sponsorship <span className="text-[#e62b1e]">Packages</span>
        </h2>
        <Reveal delay={0.05}>
          <p className="text-white/40 text-sm mb-14">Choose the partnership level that best aligns with your brand goals.</p>
        </Reveal>
        <div className="space-y-6">
          {TIERS.map((tier, i) => <TierCard key={tier.name} tier={tier} index={i} />)}
        </div>
        <Reveal delay={0.1} className="mt-10">
          <GlowCard className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <h3 className="font-display text-2xl font-black mb-1">In-Kind <span className="text-[#e62b1e]">Sponsor</span></h3>
            <h4 className="font-display text-lg font-black text-white/60 mb-4">Venue Rent Sponsor</h4>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">Support TEDxClifton through in-kind contributions. Benefits packages can be customized based on the relative value of your gift.</p>
            <div className="flex flex-wrap gap-2">
              {inKindItems.map((item, i) => (
                <motion.span key={item}
                  initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  whileHover={{ borderColor: "rgba(230,43,30,0.6)", color: "#ffffff", scale: 1.06 }}
                  className="cursor-default rounded-full border border-white/12 px-3.5 py-1.5 text-xs text-white/50 transition-colors duration-200"
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </GlowCard>
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
    <section className="bg-[#0a0102] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-4xl font-black md:text-5xl">
          Sponsorship <span className="text-[#e62b1e]">Agreement</span>
        </h2>
        <Reveal delay={0.1} className="mt-4 space-y-3 text-sm text-white/55 leading-relaxed">
          <p>Payment is required in full before activation. TEDx retains full discretion in selecting the main theme, speakers, topics, structure, and participants. All partnership funds go back into the production of the event — TEDx events are non-profit.</p>
          <p>This document acts as a good faith agreement between the parties to cooperate in making TEDx and the partnership a success.</p>
        </Reveal>
        <Reveal delay={0.15} className="mt-10">
          <GlowCard className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-8">
            <div>
              <p className="text-sm font-semibold text-white/70 mb-4">Sponsorship Level</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TIER_OPTIONS.map((t) => (
                  <label key={t.label} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-4 transition-all duration-200 hover:border-[#e62b1e]/40 hover:bg-[#e62b1e]/5 group">
                    <input type="radio" name="tier" className="accent-[#e62b1e]" />
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-[#e62b1e] transition-colors">{t.label}</div>
                      <div className="text-xs text-white/35">{t.price}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/70 mb-3">Preferred Payment</p>
              <div className="space-y-2.5">
                {["Via check (payable to: TEDx)", "Via Online Bank Transfer"].map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-3 text-sm text-white/55 hover:text-white/85 transition-colors">
                    <input type="radio" name="payment" className="accent-[#e62b1e]" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-4 border-t border-white/10 pt-6">
              {["Sponsoring Company / Organization", "Contact Name", "Contact Title"].map((field) => (
                <div key={field}>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">{field}</label>
                  <input type="text" placeholder={field}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-[#e62b1e]/60 focus:outline-none focus:ring-2 focus:ring-[#e62b1e]/20 focus:bg-white/[0.05]" />
                </div>
              ))}
            </div>
          </GlowCard>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function ContactSection() {
  return (
    <section className="bg-[#070103] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-4xl font-black mb-12 md:text-5xl">
          Contact <span className="text-[#e62b1e]">Details</span>
        </h2>
        <Reveal delay={0.1}>
          <TiltCard intensity={4}>
            <GlowCard className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-[#e62b1e]/10 blur-[90px]" />
              <div className="relative z-10">
                <div className="font-display text-2xl font-black text-white">Syed Wajid Hussain Shah</div>
                <div className="mt-1 text-sm font-medium text-[#e62b1e]">Lead Organizer, TEDxClifton</div>
                <div className="mt-8 space-y-3">
                  {["tedxcliftonkarachi@gmail.com", "syed.hussain.ethical@gmail.com"].map((email) => (
                    <motion.a key={email} href={`mailto:${email}`}
                      whileHover={{ x: 5 }} transition={{ duration: 0.25 }}
                      className="group flex items-center gap-3 text-sm text-white/55 transition-colors hover:text-white w-fit"
                    >
                      <Mail size={14} className="shrink-0 text-[#e62b1e]" />
                      <span className="underline decoration-white/20 underline-offset-4 group-hover:decoration-[#e62b1e] transition-all duration-300">{email}</span>
                    </motion.a>
                  ))}
                </div>
              </div>
            </GlowCard>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function ProposalViewer() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 28, mass: 0.3 });
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
    <div className="min-h-screen bg-[#070103] text-white" style={{ scrollBehavior: "smooth" }}>
      <CursorGlow />

      {/* scroll progress */}
      <motion.div aria-hidden style={{ scaleX: progress }}
        className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left bg-gradient-to-r from-[#e62b1e] via-rose-400 to-[#e62b1e]"
      />

      {/* header */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <div className="font-display text-base leading-none tracking-tight">
              <span className="text-[#e62b1e] font-black">TED</span><span className="text-[#e62b1e] font-black text-xs align-super">x</span><span className="text-white font-light"> Clifton</span>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/40">Sponsorship Proposal</div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button onClick={downloadPdf} disabled={busy}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-2 overflow-hidden rounded-full bg-[#e62b1e] px-4 py-2 text-sm font-bold text-white hover:bg-[#c41e13] disabled:opacity-60 transition-colors"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span className="hidden sm:inline">{busy ? "Preparing…" : "Download PDF"}</span>
              <span className="sm:hidden">PDF</span>
            </motion.button>
            <motion.button onClick={lock} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
              title="Lock proposal"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/30 hover:text-white"
            >
              <Lock size={15} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main>
        <HeroSection />
        <SectionDivider />
        <AboutSection />
        <SectionDivider />
        <LastEventSection />
        <PhotoCollageSection />
        <SpeakersSection version="1.0" speakers={V1_SPEAKERS} folder="Speaker 1.0" bg="bg-[#070103]" />
        <SpeakersSection version="2.0" speakers={V2_SPEAKERS} folder="Speaker 2.0" bg="bg-[#0a0102]" />
        <BecomeASponsorSection />
        <SectionDivider />
        <FormerPartnersSection />
        <SectionDivider />
        <ThemeSection />
        <WhyMattersSection />
        <WhyPartnerSection />
        <SectionDivider />
        <AudienceSection />
        <TeamSection />
        <SectionDivider />
        <TiersSection />
        <AgreementSection />
        <ContactSection />

        <footer className="border-t border-white/10 bg-[#070103] py-12 px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display text-xl font-bold">
            Next is <span className="text-[#e62b1e]">Now</span>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-xs uppercase tracking-[0.28em] text-white/30">
            TEDxClifton · Clifton, Karachi
          </motion.p>
        </footer>
      </main>
    </div>
  );
}
