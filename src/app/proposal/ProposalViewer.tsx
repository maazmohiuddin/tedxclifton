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
        <span key={i} className="inline-block">
          <span className="inline-block overflow-hidden leading-[1.15]">
            <motion.span
              className="inline-block"
              initial={reduced ? false : { y: "110%", opacity: 0 }}
              animate={inView ? { y: "0%", opacity: 1 } : {}}
              transition={{ duration: 0.72, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 && <span> </span>}
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

// ─── KhiNext'26 section ───────────────────────────────────────────────────────
// Design tokens lifted directly from khinext.vercel.app
// --khi-blue: #316BFF  --khi-ink: #040B1C  --khi-ink-soft: #02040A
// --border-default: hsla(0,0%,100%,.08)  --border-blue: rgba(49,107,255,.3)
// --ease-soft: cubic-bezier(0.22,1,0.36,1)
// font-display = "Helvetica Now Display, Helvetica, system-ui, sans-serif"

const KX_STATS = [
  { value: 3000, suffix: "+", label: "Attendees" },
  { value: 40,   suffix: "+", label: "Speakers" },
  { value: 7,     suffix: "",  label: "Innovation Domains" },
  { value: 30,    suffix: "+", label: "Corporate Partners" },
];

const KX_DOMAINS = [
  {
    name: "AI in Health & Pharma", color: "#51FFD5", num: "01",
    desc: "AI-assisted diagnostics, drug discovery, telemedicine — built for low-bandwidth clinics in South Asia.",
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    name: "Smart Cities", color: "#00EAEE", num: "02",
    desc: "Urban mobility, energy grids and civic infrastructure powered by real-time AI inference.",
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="9" width="18" height="12" rx="1"/><path d="M8 9V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4"/><line x1="12" y1="14" x2="12" y2="17"/>
      </svg>
    ),
  },
  {
    name: "Creative AI", color: "#BF00FF", num: "03",
    desc: "Generative art, music, writing tools and cultural heritage preservation through AI.",
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    ),
  },
  {
    name: "Fintech Future", color: "#FFB800", num: "04",
    desc: "Open finance APIs, fraud detection and micro-lending models for the unbanked.",
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8"/><path d="M12 6v2m0 8v2M9.5 9.5C9.5 8.1 10.6 7 12 7s2.5 1.1 2.5 2.5c0 2.5-5 2.5-5 5 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5"/>
      </svg>
    ),
  },
  {
    name: "DevZone", color: "#D4FF00", num: "05",
    desc: "Developer tooling, code generation, MLOps and open-source from Pakistan's engineers.",
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M8 10l-2 2 2 2M16 10l2 2-2 2"/>
      </svg>
    ),
  },
  {
    name: "Lifestyle Innovation", color: "#FF0F4B", num: "06",
    desc: "AI in fashion, food, sports and wellness — consumer-facing products for the next billion.",
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    name: "Investor Arena", color: "#E2E2E2", num: "07",
    desc: "Curated investment-ready startups presenting to 40+ active investors. Invite-only.",
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
];

// Billboard promo videos recorded live at KhiNext'26
const KX_BILLBOARD_VIDEOS = [
  { src: "/brand/Khinext Video 1.mp4", label: "Billboard Promo · Take 1" },
  { src: "/brand/Khinext Video 2.mp4", label: "Billboard Promo · Take 2" },
  { src: "/brand/Khinext Video 3.mp4", label: "Billboard Promo · Take 3" },
  { src: "/brand/Khinext Video 4.mp4", label: "Billboard Promo · Take 4" },
];

function KhiNextSection() {

  return (
    <section
      className="relative overflow-hidden py-28 px-6"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, #0a1740 0%, #02040A 55%)" }}
    >
      {/* drifting grid — matches khinext animate-grid-drift */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(49,107,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(49,107,255,1) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          animation: "kxGridDrift 24s linear infinite",
        }}
      />
      <style>{`@keyframes kxGridDrift{0%{background-position:0 0,0 0}to{background-position:56px 56px,56px 56px}}`}</style>

      {/* radial blue glow — matches khinext stats section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(49,107,255,0.07) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-3xl">

        {/* ── eyebrow — matches kx-eyebrow (24px blue bar + blue uppercase text) ── */}
        <Reveal>
          <p
            className="mb-8 flex items-center gap-2.5 text-[12px] font-bold uppercase text-[#316BFF]"
            style={{ letterSpacing: "0.22em" }}
          >
            <span aria-hidden className="inline-block h-[2px] w-6 shrink-0 bg-[#316BFF]" />
            Brought to you by the Organizers of
          </p>
        </Reveal>

        {/* ── headline — khinext hero style: extrabold, -0.045em tracking ── */}
        <Reveal delay={0.04}>
          <h2
            className="font-display font-extrabold text-white leading-[0.96]"
            style={{ fontSize: "clamp(3rem,9vw,6rem)", letterSpacing: "-0.045em" }}
          >
            Khi<em className="not-italic text-[#316BFF]" style={{
              position: "relative", display: "inline-block", isolation: "isolate",
            }}>next</em>
            <span className="text-white/30 font-bold ml-2" style={{ fontSize: "0.55em" }}>&apos;26</span>
          </h2>
          <p
            className="mt-4 mb-12 text-[11px] font-bold uppercase text-white/30"
            style={{ letterSpacing: "0.18em" }}
          >
            Pakistan&apos;s First Multi-Domain AI Summit · Pearl Continental, Karachi · 7 June 2026
          </p>
        </Reveal>

        {/* ── lead copy ── */}
        <Reveal delay={0.08}>
        <div className="mb-14 space-y-4 text-[15px] leading-relaxed" style={{ color: "hsla(0,0%,100%,0.55)" }}>
          <p>
            The same team that built KhiNext&apos;26 — Pakistan&apos;s biggest multi-domain AI summit,{" "}
            <span className="text-white font-semibold">10,000+ attendees, 100+ speakers, 7 domains</span> —
            is now channelling that same rigour into TEDxClifton 3.0.
          </p>
          <p>
            Where KhiNext proved Karachi can host world-class tech discourse, TEDxClifton asks the
            harder question: what ideas, told beautifully, will actually change the way this city thinks?
            Both events share one conviction — the future is already here, and it belongs to those who show up.
          </p>
        </div>
        </Reveal>

        {/* ── stats — matches khinext stat row: extrabold, clamp, -0.04em ── */}
        <div
          className="mb-16 grid grid-cols-2 overflow-hidden rounded-2xl border lg:grid-cols-4"
          style={{ borderColor: "hsla(0,0%,100%,0.08)", background: "hsla(0,0%,100%,0.012)" }}
        >
          {KX_STATS.map((s, i) => (
            <Reveal key={s.label} delay={0.06 + i * 0.08}>
              <div
                className="flex flex-col items-center justify-center gap-2 py-10 px-5 text-center transition-colors duration-300 hover:bg-white/[0.02]"
                style={{
                  borderRight: i < KX_STATS.length - 1 ? "1px solid hsla(0,0%,100%,0.08)" : undefined,
                  borderBottom: i < 2 ? "1px solid hsla(0,0%,100%,0.08)" : undefined,
                }}
              >
                <div
                  className="font-display font-extrabold text-white tabular-nums leading-none"
                  style={{ fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-0.04em" }}
                >
                  <CountUp to={s.value} suffix="" duration={1.8} />
                  <span className="text-[#316BFF]">{s.suffix}</span>
                </div>
                <div className="text-xs text-white/45 tracking-wide">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ── billboard videos ── */}
        <Reveal delay={0.06}>
          <p
            className="mb-2 flex items-center gap-2.5 text-[12px] font-bold uppercase text-[#316BFF]"
            style={{ letterSpacing: "0.22em" }}
          >
            <span aria-hidden className="inline-block h-[2px] w-6 shrink-0 bg-[#316BFF]" />
            Billboard Promos
          </p>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: "hsla(0,0%,100%,0.45)" }}>
            KhiNext&apos;26 ran city-wide outdoor billboard campaigns across Karachi. These promo videos
            played on digital screens across the city — a glimpse of the scale your brand steps into.
          </p>
        </Reveal>

        <div className="mb-16 grid grid-cols-2 gap-4">
          {KX_BILLBOARD_VIDEOS.map((v, i) => (
            <Reveal key={v.src} delay={0.07 + i * 0.06} direction="scale">
              <div
                className="group relative aspect-video overflow-hidden rounded-2xl transition-all duration-300"
                style={{ background: "#040e22", border: "1px solid hsla(0,0%,100%,0.08)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(49,107,255,0.3)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 48px rgba(0,0,0,0.35)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "hsla(0,0%,100%,0.08)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={v.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Reveal>
          ))}
        </div>

        {/* ── event photo gallery — Google Drive folder embed ── */}
        <Reveal delay={0.06}>
          <p
            className="mb-2 flex items-center gap-2.5 text-[12px] font-bold uppercase text-[#316BFF]"
            style={{ letterSpacing: "0.22em" }}
          >
            <span aria-hidden className="inline-block h-[2px] w-6 shrink-0 bg-[#316BFF]" />
            Event Gallery
          </p>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "hsla(0,0%,100%,0.45)" }}>
            Behind-the-scenes photography from KhiNext&apos;26 — the same energy, ambition, and
            production quality we bring to every event we organise.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div
            className="group relative mb-16 overflow-hidden rounded-2xl transition-all duration-300"
            style={{
              border: "1px solid hsla(0,0%,100%,0.08)",
              background: "#040e22",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(49,107,255,0.3)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 48px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(49,107,255,0.12)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "hsla(0,0%,100%,0.08)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            {/* top bar — matches kx-card header style */}
            <div
              className="flex items-center justify-between border-b px-5 py-3"
              style={{ borderColor: "hsla(0,0%,100%,0.06)", background: "hsla(0,0%,100%,0.03)" }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#316BFF] opacity-70" />
                <span className="text-[11px] font-bold uppercase text-white/30" style={{ letterSpacing: "0.18em" }}>
                  KHINEXT &apos;26 — Official Photography
                </span>
              </div>
              <a
                href="https://drive.google.com/drive/folders/1ZiBDHNJTWG0HncXc3GdoicAu7RTIPxa1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-[#316BFF]/70 transition-colors hover:text-[#316BFF]"
                style={{ letterSpacing: "0.1em" }}
              >
                Open in Drive ↗
              </a>
            </div>
            <iframe
              src="https://drive.google.com/embeddedfolderview?id=1ZiBDHNJTWG0HncXc3GdoicAu7RTIPxa1#grid"
              title="KhiNext'26 Event Gallery"
              className="w-full"
              style={{ height: 480, border: "none", background: "#040e22" }}
              loading="lazy"
            />
          </div>
        </Reveal>

        {/* ── domain cards — replicates kx-card domain grid with per-color accents ── */}
        <Reveal delay={0.06}>
          <p
            className="mb-8 flex items-center gap-2.5 text-[12px] font-bold uppercase text-[#316BFF]"
            style={{ letterSpacing: "0.22em" }}
          >
            <span aria-hidden className="inline-block h-[2px] w-6 shrink-0 bg-[#316BFF]" />
            7 Domains of Tomorrow
          </p>
        </Reveal>

        <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KX_DOMAINS.map((d, i) => (
            <Reveal key={d.name} delay={0.05 + i * 0.05}>
              <TiltCard intensity={5}>
                <article
                  className="group relative h-full cursor-default overflow-hidden rounded-2xl p-6 transition-all duration-300"
                  style={{
                    background: "hsla(0,0%,100%,0.04)",
                    border: "1px solid hsla(0,0%,100%,0.08)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${d.color}55`;
                    el.style.transform = "translateY(-3px)";
                    el.style.boxShadow = `0 20px 48px rgba(0,0,0,0.35), 0 0 0 0.5px ${d.color}22`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "hsla(0,0%,100%,0.08)";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}
                >
                  {/* corner radial glow */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle, ${d.color}22 0%, transparent 70%)`, filter: "blur(18px)" }}
                  />
                  {/* faded corner number — matches screenshot */}
                  <span
                    aria-hidden
                    className="absolute right-5 top-4 select-none font-display text-5xl font-extrabold leading-none"
                    style={{ color: "rgba(255,255,255,0.07)", letterSpacing: "-0.04em" }}
                  >
                    {d.num}
                  </span>

                  {/* icon + name row */}
                  <div className="relative mb-4 flex items-center gap-3">
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-all duration-300 group-hover:scale-105"
                      style={{
                        background: `${d.color}18`,
                        border: `1px solid ${d.color}44`,
                        boxShadow: `0 0 18px ${d.color}22`,
                      }}
                    >
                      {d.icon(d.color)}
                    </div>
                    <h3 className="font-display text-[15px] font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>
                      {d.name}
                    </h3>
                  </div>

                  {/* description */}
                  <p className="relative text-[13px] leading-relaxed" style={{ color: "hsla(0,0%,100%,0.45)" }}>
                    {d.desc}
                  </p>

                  {/* bottom reveal line */}
                  <div
                    aria-hidden
                    className="absolute bottom-0 left-5 right-5 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                    style={{ background: `linear-gradient(90deg, ${d.color}, transparent)` }}
                  />
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        {/* ── closing bridge — styled as kx-banner (shimmer sweep on hover) ── */}
        <Reveal delay={0.08}>
          <div
            className="group relative mb-8 overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "hsla(0,0%,100%,0.04)",
              border: "1px solid rgba(49,107,255,0.3)",
              boxShadow: "0 0 0 0 rgba(49,107,255,0.4), 0 6px 22px rgba(49,107,255,0.32)",
            }}
          >
            {/* shimmer sweep — matches kx-banner :before */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] -translate-x-full transition-transform duration-700 group-hover:translate-x-full"
              style={{ background: "linear-gradient(105deg, transparent 30%, hsla(0,0%,100%,0.04) 50%, transparent 70%)" }}
            />
            <p
              className="mb-3 text-[10px] font-bold uppercase text-[#316BFF]/70"
              style={{ letterSpacing: "0.28em" }}
            >
              Why this matters for your brand
            </p>
            <p className="text-[15px] leading-relaxed" style={{ color: "hsla(0,0%,100%,0.65)" }}>
              Partnering with TEDxClifton 3.0 means standing beside the team that defined the
              standard for large-scale intellectual events in Pakistan. You don&apos;t just get a logo
              on a banner — you get association with a team that delivers at the highest level, a
              room full of decision-makers, and a legacy that outlasts the day of the event.
            </p>
          </div>
        </Reveal>

        {/* ── footer — nav-link underline style from khinext header ── */}
        <Reveal delay={0.12}>
          <div className="flex items-center gap-5" style={{ color: "hsla(0,0%,100%,0.2)" }}>
            <div className="h-px flex-1" style={{ background: "hsla(0,0%,100%,0.08)" }} />
            <a
              href="https://www.khinext.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative text-sm transition-colors duration-200 hover:text-white"
              style={{ color: "hsla(0,0%,100%,0.45)" }}
            >
              khinext.com
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-px w-0 transition-[width] duration-300 group-hover:w-1/2"
                style={{ background: "linear-gradient(90deg, #4579FF, transparent)" }}
              />
            </a>
            <span style={{ color: "hsla(0,0%,100%,0.15)" }}>·</span>
            <span className="text-sm" style={{ color: "hsla(0,0%,100%,0.25)", letterSpacing: "0.08em" }}>@khinext</span>
            <div className="h-px flex-1" style={{ background: "hsla(0,0%,100%,0.08)" }} />
          </div>
        </Reveal>
      </div>
    </section>
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
      {/* ── hero video — parallax layer ── */}
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute inset-0 will-change-transform"
        aria-hidden
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src="/brand/Hero video.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover object-center"
          style={{ opacity: 0.55 }}
        />
        {/* dark vignette — heavier at top/bottom so text stays legible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #070103 0%, rgba(7,1,3,0.45) 28%, rgba(7,1,3,0.35) 55%, rgba(7,1,3,0.72) 82%, #070103 100%)",
          }}
        />
        {/* subtle red tint overlay */}
        <div className="absolute inset-0" style={{ background: "rgba(230,43,30,0.06)" }} />
      </motion.div>

      {/* ambient glows (kept, but toned down) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.14, 1], opacity: [0.04, 0.09, 0.04] }}
          transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e62b1e] blur-[150px]"
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

        <h1 className="font-display font-light leading-[0.92] tracking-tight" style={{ fontSize: "clamp(3.5rem,11vw,8rem)" }}>
          <AnimatedWords text="Next is" className="text-white" delay={0.4} />
          {" "}
          <AnimatedWords text="Now" className="font-black text-[#e62b1e] italic" delay={0.7} />
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
        <h2 className="font-display text-4xl font-light md:text-5xl">
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
  const editions = [
    {
      edition: "1.0",
      theme: "Breaking Boundaries",
      date: "February 25th",
      tagline: "A bold call to push past limitations, challenge societal norms, and redefine what's possible.",
      body: "TEDxClifton 1.0 became one of the most celebrated TEDx events ever held in Pakistan. One of our international speakers — a former official TED speaker — publicly compared it to some of the most prestigious TED events in the United States, calling it “a globally competitive TEDx experience that sets a new benchmark for Pakistan.”",
      quote: "The meticulous organization, the diversity and depth of the talks, the electrifying energy of the crowd — it was unlike anything I've seen at a TEDx in South Asia.",
      stats: [
        { to: 1000, suffix: "+", label: "Attendees" },
        { to: 200,  suffix: "+", label: "CEOs & Leaders" },
        { to: 10,   suffix: "+", label: "Speakers" },
        { to: 1, prefix: "#", suffix: "", label: "In Pakistan" },
      ],
      wordmark: "/brand/v1-wordmark.svg",
      banner: "/brand/Banner1.jpeg",
      icon: "/brand/Breaking Boundaries Icon.png",
      accent: "#e62b1e",
    },
    {
      edition: "2.0",
      theme: "The Other Side",
      date: "12 Sept 2025",
      tagline: "An invitation to look beyond what we see — into complexity, contradiction, and the unexplored.",
      body: "TEDxClifton 2.0 deepened the promise of its predecessor. Where 1.0 broke through walls, 2.0 asked what exists on the other side — the ideas, people, and perspectives that don't make the front page. The result was a room full of earned wisdom, quiet revolutions, and stories that changed minds.",
      quote: "TEDxClifton keeps proving that Karachi is not just ready for global ideas — it's already producing them.",
      stats: [
        { to: 1200, suffix: "+", label: "Attendees" },
        { to: 250,  suffix: "+", label: "CEOs & Leaders" },
        { to: 14,   suffix: "+", label: "Speakers" },
        { to: 2, prefix: "", suffix: " Stages", label: "Main + Firechat" },
      ],
      wordmark: "/brand/v2-wordmark.svg",
      banner: "/brand/Banner2.jpeg",
      icon: "/brand/The Other Side.png",
      accent: "#c0001a",
    },
  ];

  return (
    <section className="bg-[#070103] py-28 px-6">
      <div className="mx-auto max-w-3xl">

        {/* eyebrow */}
        <Reveal>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]">
            Our Track Record
          </p>
        </Reveal>
        <Reveal delay={0.04}>
          <h2 className="font-display text-4xl font-light md:text-5xl">
            <AnimatedWords text="Two Editions. One Standard." />
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-3 mb-14 text-sm leading-relaxed text-white/45">
            Every TEDxClifton edition has set a new ceiling for what a TEDx event can be in Pakistan —
            from production quality to speaker calibre to the conversations that outlast the room.
          </p>
        </Reveal>

        <div className="space-y-10">
          {editions.map((ed, ei) => (
            <Reveal key={ed.edition} delay={ei * 0.08} direction="up">
              <article
                className="group relative overflow-hidden rounded-3xl"
                style={{
                  background: "hsla(0,0%,100%,0.03)",
                  border: "1px solid hsla(0,0%,100%,0.07)",
                }}
              >
                {/* ── split header: photo left | content panel right ── */}
                <div className="flex flex-col sm:flex-row sm:min-h-[280px]">

                  {/* LEFT — banner photo (40% on desktop) */}
                  <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-[42%]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ed.banner}
                      alt=""
                      aria-hidden
                      className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* right-side fade into dark panel */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(to right, transparent 50%, rgba(7,1,3,0.85) 100%)",
                      }}
                    />
                    {/* bottom fade on mobile */}
                    <div
                      className="absolute inset-0 sm:hidden"
                      style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(7,1,3,0.9) 100%)" }}
                    />
                  </div>

                  {/* RIGHT — dark content panel (60% on desktop) */}
                  <div
                    className="relative flex flex-1 flex-col justify-center gap-5 px-7 py-8"
                    style={{ background: "rgba(7,1,3,0.92)" }}
                  >
                    {/* accent top-line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: ed.accent }} />

                    {/* edition + date badges */}
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-[10px] font-black uppercase"
                        style={{ background: ed.accent, color: "#fff", letterSpacing: "0.2em", boxShadow: `0 4px 18px ${ed.accent}55` }}
                      >
                        TEDxClifton {ed.edition}
                      </span>
                      <span
                        className="rounded-full border px-3 py-1 text-[10px] font-semibold text-white/50"
                        style={{ borderColor: "hsla(0,0%,100%,0.10)", letterSpacing: "0.1em" }}
                      >
                        {ed.date}
                      </span>
                    </div>

                    {/* icon + theme name row */}
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ed.icon}
                        alt=""
                        className="h-16 w-16 shrink-0 object-contain transition-transform duration-500 group-hover:scale-110"
                        style={{ filter: `drop-shadow(0 0 14px ${ed.accent}66)` }}
                      />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-white/30" style={{ letterSpacing: "0.22em" }}>Theme</p>
                        <h3
                          className="font-display font-extrabold text-white leading-tight"
                          style={{ fontSize: "clamp(1.35rem,3vw,1.9rem)", letterSpacing: "-0.03em" }}
                        >
                          &ldquo;{ed.theme}&rdquo;
                        </h3>
                      </div>
                    </div>

                    {/* wordmark */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ed.wordmark}
                      alt={`TEDxClifton ${ed.edition} wordmark`}
                      className="w-full max-w-[260px] opacity-70 transition-opacity duration-300 group-hover:opacity-90"
                      style={{ filter: "drop-shadow(0 2px 12px rgba(235,0,40,0.2))" }}
                    />

                    {/* tagline */}
                    <p className="text-[13px] leading-relaxed text-white/45 max-w-xs">{ed.tagline}</p>
                  </div>
                </div>

                {/* card body */}
                <div className="p-7 pt-5">
                  {/* stats grid */}
                  <div
                    className="mb-7 grid grid-cols-4 overflow-hidden rounded-xl"
                    style={{ border: "1px solid hsla(0,0%,100%,0.07)", background: "hsla(0,0%,100%,0.02)" }}
                  >
                    {ed.stats.map((s, si) => (
                      <div
                        key={s.label}
                        className="flex flex-col items-center justify-center gap-1 py-5 text-center"
                        style={{ borderRight: si < ed.stats.length - 1 ? "1px solid hsla(0,0%,100%,0.07)" : undefined }}
                      >
                        <div
                          className="font-display text-xl font-black tabular-nums sm:text-2xl"
                          style={{ color: ed.accent, letterSpacing: "-0.03em" }}
                        >
                          <CountUp to={s.to} prefix={s.prefix ?? ""} suffix={s.suffix} duration={1.6} />
                        </div>
                        <div className="text-[10px] text-white/35 leading-tight px-1">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* body copy */}
                  <p className="mb-6 text-sm leading-relaxed text-white/55">{ed.body}</p>

                  {/* quote */}
                  <motion.blockquote
                    whileHover={{ x: 4, borderLeftColor: ed.accent }}
                    transition={{ duration: 0.25 }}
                    className="border-l-2 pl-5 text-[13px] italic leading-relaxed text-white/40 transition-colors duration-300"
                    style={{ borderColor: `${ed.accent}55` }}
                  >
                    &ldquo;{ed.quote}&rdquo;
                  </motion.blockquote>

                  {/* Drive gallery — for both editions */}
                  {(ed.edition === "1.0" || ed.edition === "2.0") && (
                    <div className="mt-8">
                      <p className="mb-3 text-[11px] font-bold uppercase text-white/30" style={{ letterSpacing: "0.22em" }}>
                        Event Gallery
                      </p>
                      <div
                        className="overflow-hidden rounded-2xl"
                        style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}
                      >
                        <iframe
                          src={`https://drive.google.com/embeddedfolderview?id=${ed.edition === "1.0" ? "1ugYcFKmWIiG-EIB0UKLq52ysJ6U6Okcq" : "1INMXldiwnZ5eQELzh-bSFoTRxFhzJnXF"}#grid`}
                          className="w-full"
                          style={{ height: 420, border: "none", background: "#0a0a0a" }}
                          title={`TEDxClifton ${ed.edition} — ${ed.theme} gallery`}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* bottom accent line on hover */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] origin-left scale-x-0 transition-transform duration-700 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, ${ed.accent}, transparent)` }}
                />
              </article>
            </Reveal>
          ))}
        </div>
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
          {version === "1.0" ? "Breaking Boundaries" : "The Other Side"}
        </motion.div>
        <h2 className="font-display text-4xl font-light mb-14 md:text-5xl">
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
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14" strokeWidth="2"/><line x1="12" y1="14" x2="12" y2="14" strokeWidth="2"/><line x1="16" y1="14" x2="16" y2="14" strokeWidth="2"/>
        </svg>
      ),
      label: "1 Day", desc: "High-impact conference",
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
        </svg>
      ),
      label: "12 Speakers", desc: "World-class lineup",
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="17" cy="7" r="3"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
        </svg>
      ),
      label: "2000+", desc: "Expected attendees",
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 15.5"/>
        </svg>
      ),
      label: "300 Min", desc: "Community building",
    },
  ];

  return (
    <section className="bg-[#0a0102] py-28 px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]">
          Partnership
        </motion.div>
        <h2 className="font-display text-4xl font-light leading-tight md:text-5xl">
          <AnimatedWords text="Become a Sponsor" />
          <br />
          <AnimatedWords text="for TEDxClifton 3.0" delay={0.22} className="font-black text-[#e62b1e]" />
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {highlights.map((h, i) => (
            <Reveal key={h.label} delay={i * 0.09} direction="scale">
              <TiltCard>
                <GlowCard className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center h-full">
                  <div className="mb-3 flex justify-center text-white/50">
                    {h.icon}
                  </div>
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

// ─── Instagram Live Card ──────────────────────────────────────────────────────

interface IGProfile {
  username: string;
  biography: string;
  followers_count: number;
  media_count: number;
  profile_picture_url: string;
  media: { id: string; media_url: string; thumbnail_url?: string; permalink: string; media_type: string }[];
}

function InstagramLiveCard() {
  const [data, setData] = useState<IGProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/instagram")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const igGradient = "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";

  return (
    <div
      className="mb-16 overflow-hidden rounded-2xl"
      style={{ border: "1px solid hsla(0,0%,100%,0.07)", background: "hsla(0,0%,100%,0.025)" }}
    >
      {/* profile header */}
      <div
        className="flex items-center justify-between gap-4 border-b px-6 py-5"
        style={{ borderColor: "hsla(0,0%,100%,0.06)" }}
      >
        <div className="flex items-center gap-4">
          {/* avatar */}
          <div className="relative h-12 w-12 shrink-0">
            <div className="absolute inset-0 rounded-full p-[2px]" style={{ background: igGradient }}>
              <div className="h-full w-full rounded-full overflow-hidden bg-[#070103]">
                {data?.profile_picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.profile_picture_url} alt="@tedxclifton" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full" style={{ background: igGradient }} />
                )}
              </div>
            </div>
          </div>
          {/* name + bio */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">@{data?.username ?? "tedxclifton"}</span>
              {/* verified badge */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#0095F6"/>
                <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="mt-0.5 max-w-xs text-[11px] leading-snug text-white/40 line-clamp-2">
              {loading ? "Loading…" : (data?.biography ?? "Independent TEDx event in Clifton, Karachi")}
            </p>
          </div>
        </div>
        {/* follower + post count */}
        <div className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
          <div className="font-display text-lg font-black text-white" style={{ letterSpacing: "-0.04em" }}>
            {loading ? "—" : (data?.followers_count?.toLocaleString() ?? "3,314")}
          </div>
          <div className="text-[10px] text-white/30" style={{ letterSpacing: "0.1em" }}>FOLLOWERS</div>
          <div className="mt-1.5 text-[11px] text-white/25">
            {loading ? "" : `${(data?.media_count ?? 174).toLocaleString()} posts`}
          </div>
        </div>
      </div>

      {/* post grid — 3×3, only shown when API returns media */}
      {!loading && data && data.media.length > 0 && (
        <div className="grid grid-cols-3 gap-[2px] bg-white/[0.04]">
          {data.media.slice(0, 9).map((post) => {
            const thumb = post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
            return (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden bg-white/[0.03]"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full" style={{ background: igGradient, opacity: 0.15 }} />
                )}
                {post.media_type === "VIDEO" && (
                  <div className="absolute top-2 right-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity={0.8}><path d="M5 3l14 9-14 9V3z"/></svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
              </a>
            );
          })}
        </div>
      )}

      {/* metrics row */}
      <div className="grid grid-cols-2 divide-x divide-white/[0.06] sm:grid-cols-4">
        {[
          { val: "1,426,250", label: "Views" },
          { val: "201,705",   label: "Accounts Reached" },
          { val: loading ? "—" : (data?.followers_count?.toLocaleString() ?? "3,314"), label: "Followers" },
          { val: loading ? "—" : (data?.media_count?.toLocaleString() ?? "174"), label: "Posts" },
        ].map(m => (
          <div key={m.label} className="flex flex-col items-center justify-center gap-1 py-8">
            <div className="font-display text-xl font-black text-white sm:text-2xl" style={{ letterSpacing: "-0.04em" }}>{m.val}</div>
            <div className="text-[11px] text-white/35">{m.label}</div>
          </div>
        ))}
      </div>

      {/* footer */}
      <div
        className="border-t px-6 py-3 text-[11px] text-white/25"
        style={{ borderColor: "hsla(0,0%,100%,0.05)" }}
      >
        79.6% of views came from non-followers — strong organic discovery reach
      </div>
    </div>
  );
}

// ─── Marketing Reach Section ──────────────────────────────────────────────────

const MKT_STATS = [
  { value: "1.4M+",  label: "Video Views",          sub: "across social platforms" },
  { value: "201K+",  label: "Accounts Reached",      sub: "in 30 days" },
  { value: "50+",    label: "Influencers",            sub: "covered event day live" },
  { value: "6–8",    label: "TV News Channels",       sub: "mainstream media coverage" },
  { value: "15+",    label: "Universities",           sub: "on-campus marketing" },
  { value: "360°",   label: "Campaign Approach",      sub: "digital · outdoor · media" },
];

const MKT_CHANNELS = [
  {
    title: "High-Impact Outdoor & On-Ground",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
    body: "Large-scale digital LED placements at Shahrah-e-Faisal, Clifton, and Tariq Road — generating massive urban visibility and recall for every sponsor and partner.",
  },
  {
    title: "Strategic Ecosystem Partnerships",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    body: "Collaborated with Startup Pakistan — partners received prominent visibility across 3–4 dedicated digital pages. Also promoted through Startup Karachi, Business Bytes, and their official LinkedIn, Instagram, and Facebook channels.",
  },
  {
    title: "15+ University Campuses",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    body: "Targeted on-campus marketing across 15+ leading universities, directly engaging thousands of students and young professionals — driving strong organic reach within academic communities.",
  },
  {
    title: "Mainstream Media Coverage",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/>
      </svg>
    ),
    body: "Extensive coverage across major newspapers and featured on 6–8 national TV news channels, significantly amplifying credibility, reach, and brand trust for all associated partners.",
  },
  {
    title: "Digital & Social Media",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    body: "Millions of impressions and reach through official social platforms — driven by strategic content distribution, speaker-led promotions, and community amplification.",
  },
  {
    title: "50+ Influencers on Event Day",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
      </svg>
    ),
    body: "On event day, 50+ Instagram influencers and bloggers actively covered and promoted TEDxClifton, creating real-time buzz, authentic storytelling, and strong post-event visibility.",
  },
];

function MarketingReachSection() {
  return (
    <section className="bg-[#070103] py-28 px-6">
      <div className="mx-auto max-w-3xl">

        {/* eyebrow */}
        <Reveal>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#e62b1e]">
            TEDxClifton 1.0 &amp; TEDxClifton 2.0
          </p>
        </Reveal>

        {/* headline */}
        <Reveal delay={0.04}>
          <h2
            className="font-display font-extrabold leading-[1.0] text-white"
            style={{ fontSize: "clamp(2.6rem,7vw,4.5rem)", letterSpacing: "-0.04em" }}
          >
            Proven Marketing{" "}
            <span className="text-[#e62b1e]">Reach</span>
            {" "}&amp;{" "}
            <br className="hidden sm:block" />
            Media{" "}
            <span className="text-[#e62b1e]">Exposure</span>
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mt-5 mb-14 text-[15px] leading-relaxed text-white/55">
            TEDxClifton has consistently delivered exceptional visibility and brand exposure for its
            sponsors and partners. Across both editions we executed a comprehensive 360-degree
            marketing and media campaign — ensuring strong reach across digital, on-ground,
            institutional, and mainstream media platforms.
          </p>
        </Reveal>

        {/* stats ribbon */}
        <div className="mb-16 grid grid-cols-2 overflow-hidden rounded-2xl border sm:grid-cols-3"
          style={{ borderColor: "hsla(0,0%,100%,0.07)", background: "hsla(0,0%,100%,0.015)" }}
        >
          {MKT_STATS.map((s, i) => (
            <Reveal key={s.label} delay={0.05 + i * 0.05}>
              <div
                className="flex flex-col justify-center gap-1 px-6 py-8 transition-colors hover:bg-white/[0.02]"
                style={{
                  borderRight: (i % 3 !== 2) ? "1px solid hsla(0,0%,100%,0.07)" : undefined,
                  borderBottom: i < 3 ? "1px solid hsla(0,0%,100%,0.07)" : undefined,
                }}
              >
                <div
                  className="font-display font-black tabular-nums leading-none text-[#e62b1e]"
                  style={{ fontSize: "clamp(1.7rem,4vw,2.6rem)", letterSpacing: "-0.04em" }}
                >
                  {s.value}
                </div>
                <div className="text-[13px] font-semibold text-white/80">{s.label}</div>
                <div className="text-[11px] text-white/35">{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* channel cards */}
        <div className="mb-16 grid gap-4 sm:grid-cols-2">
          {MKT_CHANNELS.map((ch, i) => (
            <Reveal key={ch.title} delay={0.05 + i * 0.05}>
              <div
                className="group relative h-full overflow-hidden rounded-2xl p-6 transition-all duration-300"
                style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.07)" }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(230,43,30,0.3)";
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 16px 40px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "hsla(0,0%,100%,0.07)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                <div
                  className="mb-4 grid h-10 w-10 place-items-center rounded-xl text-[#e62b1e]"
                  style={{ background: "rgba(230,43,30,0.1)", border: "1px solid rgba(230,43,30,0.2)" }}
                >
                  {ch.icon}
                </div>
                <h3 className="mb-2 text-[14px] font-bold text-white" style={{ letterSpacing: "-0.01em" }}>
                  {ch.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-white/50">{ch.body}</p>
                <div
                  aria-hidden
                  className="absolute bottom-0 left-5 right-5 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: "linear-gradient(90deg, #e62b1e, transparent)" }}
                />
              </div>
            </Reveal>
          ))}
        </div>

        {/* Instagram live card */}
        <Reveal delay={0.06}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#e62b1e]">
            Social Media Analytics
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <InstagramLiveCard />
        </Reveal>

        {/* Startup Pakistan collaboration */}
        <Reveal delay={0.06}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#e62b1e]">
            Collaboration with Startup Pakistan
          </p>
          <p className="mb-8 text-[13px] leading-relaxed text-white/45">
            Partners and sponsors received prominent cross-promotion across 3–4 dedicated pages
            of the Startup Pakistan network — Startup Pakistan, Startup Karachi, Business Bytes,
            and their official social channels.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mb-16 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl"
                style={{ border: "1px solid hsla(0,0%,100%,0.08)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/brand/Startup (${n}).png`}
                  alt={`Startup Pakistan post ${n}`}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute bottom-0 left-0 right-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: "linear-gradient(90deg, #e62b1e, transparent)" }}
                />
              </div>
            ))}
          </div>
        </Reveal>

        {/* Digital billboards in Karachi */}
        <Reveal delay={0.06}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#e62b1e]">
            Digital Influence in Karachi
          </p>
          <p className="mb-8 text-[13px] leading-relaxed text-white/45">
            Large-scale digital LED billboard campaigns across Karachi&apos;s key arterial roads —
            Shahrah-e-Faisal, Clifton, and Tariq Road — driving brand recall at city scale.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mb-8 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                className="group relative aspect-video overflow-hidden rounded-xl"
                style={{ background: "#000", border: "1px solid hsla(0,0%,100%,0.07)" }}
              >
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={`/brand/TedXVideo (${n}).mp4`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </div>
            ))}
          </div>
        </Reveal>

        {/* overall impact */}
        <Reveal delay={0.08}>
          <motion.div
            whileHover={{ x: 4, borderLeftColor: "rgba(230,43,30,0.8)" }}
            transition={{ duration: 0.25 }}
            className="border-l-2 pl-6 transition-colors duration-300"
            style={{ borderColor: "rgba(230,43,30,0.35)" }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#e62b1e]/70">
              Overall Impact
            </p>
            <p className="text-[14px] leading-relaxed text-white/55">
              The combined effect of outdoor advertising, university collaborations, startup
              ecosystem partnerships, mainstream media exposure, influencer marketing, and
              high-performing digital campaigns resulted in exceptional mileage and brand value
              for TEDxClifton and all its sponsors and partners.
            </p>
          </motion.div>
        </Reveal>

      </div>
    </section>
  );
}

function FormerPartnersSection() {
  return (
    <section className="bg-[#070103] py-28 overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 mb-12">
        <h2 className="font-display text-4xl font-light mb-3 md:text-5xl">
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
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear", repeatType: "loop" }}
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
        <h2 className="font-display text-4xl font-light leading-tight md:text-5xl">
          <AnimatedWords text="Next Is Now —" />
          <br />
          <AnimatedWords text="Ideas Shaping the World" delay={0.28} />
          <br />
          <AnimatedWords text="Before It Arrives" delay={0.54} className="font-black text-[#e62b1e]" />
        </h2>

        <Reveal delay={0.12} className="mt-9 space-y-4 text-sm leading-relaxed text-white/65">
          <p>After redefining limits with Breaking Boundaries and shifting perspectives with The Other Side, TEDxClifton returns with its most urgent and future-driven edition yet.</p>
          <p>TEDxClifton 3.0: Next Is Now is a call to recognize that the future is no longer distant, theoretical, or "coming soon." It is unfolding right now — in our cities, our technologies, our identities, and our choices.</p>
          <p>This edition is about the people who aren't waiting for tomorrow. The builders, thinkers, and disruptors who are already living in what the world still calls "next."</p>
        </Reveal>

        <Reveal delay={0.2} className="mt-14">
          <h3 className="font-display text-2xl font-light mb-6">What <span className="font-black text-[#e62b1e]">"Next Is Now"</span> Means</h3>
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
          <h2 className="font-display text-4xl font-light md:text-5xl">
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
            <h3 className="font-display text-2xl font-light mb-3">The <span className="font-black text-[#e62b1e]">Legacy</span> Continues</h3>
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
        <h2 className="font-display text-3xl font-light leading-tight md:text-4xl">
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
        <h2 className="font-display text-4xl font-light mb-14 md:text-5xl">
          <AnimatedWords text="Our Targeted" />{" "}
          <AnimatedWords text="Audience" className="font-black text-[#e62b1e]" delay={0.28} />
        </h2>
        <DonutChart />
      </div>
    </section>
  );
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: "Title", accent: "Sponsor", price: "2,500,000 PKR", color: "#a78bfa", glow: "rgba(167,139,250,0.14)",
    benefits: [
      "Speakers Lounge Branding — display of sponsor logos & materials",
      "Branding During Transitions — video/logo display during breaks",
      "Logo on Event Tickets — featured on official event passes",
      "Logo Display on Digital Screens Across Karachi",
      "Booth in Main Hall — branded booth in the main conference hall",
      "Mention in Pre-event Blog / Press Pieces",
      "Logo on Conference Collateral (T-Shirts, Pens, Bags, Notebooks)",
      "Ad Placement in Conference Booklets",
      "Distribution of Branded Collateral",
      "Logo on Conference Website (with hyperlink)",
      "Social Media Mentions & Coverage",
      "Full Venue Branding (Digital Screens / Printables)",
      "Branding on Social Media Posts",
      "Networking Hub — Exhibit Booth Space",
    ],
  },
  {
    name: "Platinum", accent: "Sponsor", price: "2,000,000 PKR", color: "#e5e7eb", glow: "rgba(229,231,235,0.10)",
    benefits: [
      "Logo on Event Tickets — featured on official event passes",
      "Logo Display on Digital Screens Across Karachi",
      "Booth in Main Hall — branded booth in the main conference hall",
      "Mention in Pre-event Blog / Press Pieces",
      "Logo on Conference Collateral (T-Shirts, Pens, Bags, Notebooks)",
      "Ad Placement in Conference Booklets",
      "Distribution of Branded Collateral",
      "Logo on Conference Website (with hyperlink)",
      "Social Media Mentions & Coverage",
      "Full Venue Branding (Digital Screens / Printables)",
      "Branding on Social Media Posts",
      "Networking Hub — Exhibit Booth Space",
    ],
  },
  {
    name: "Gold", accent: "Sponsor", price: "1,500,000 PKR", color: "#FFD700", glow: "rgba(255,215,0,0.13)",
    benefits: [
      "Mention in Pre-event Blog / Press Pieces",
      "Logo on Conference Collateral (T-Shirts, Pens, Bags, Notebooks)",
      "Ad Placement in Conference Booklets",
      "Distribution of Branded Collateral",
      "Logo on Conference Website (with hyperlink)",
      "Social Media Mentions & Coverage",
      "Full Venue Branding (Digital Screens / Printables)",
      "Branding on Social Media Posts",
      "Networking Hub — Exhibit Booth Space",
    ],
  },
  {
    name: "Silver", accent: "Sponsor", price: "1,000,000 PKR", color: "#C0C0C0", glow: "rgba(192,192,192,0.11)",
    benefits: [
      "Ad Placement in Conference Booklets",
      "Distribution of Branded Collateral",
      "Logo on Conference Website (with hyperlink)",
      "Social Media Mentions & Coverage",
      "Full Venue Branding (Digital Screens / Printables)",
      "Branding on Social Media Posts",
      "Networking Hub — Exhibit Booth Space",
    ],
  },
  {
    name: "Bronze", accent: "Sponsor", price: "700,000 PKR", color: "#CD7F32", glow: "rgba(205,127,50,0.11)",
    benefits: [
      "Distribution of Branded Collateral",
      "Logo on Conference Website (with hyperlink)",
      "Social Media Mentions & Coverage",
      "Full Venue Branding (Digital Screens / Printables)",
      "Branding on Social Media Posts",
      "Networking Hub — Exhibit Booth Space",
    ],
  },
];

// Tier comparison matrix
const TIER_NAMES = ["Title", "Platinum", "Gold", "Silver", "Bronze"] as const;
const TIER_COLORS: Record<string, string> = {
  Title: "#a78bfa", Platinum: "#e5e7eb", Gold: "#FFD700", Silver: "#C0C0C0", Bronze: "#CD7F32",
};

const TIERS_MATRIX: { offering: string; desc: string; tiers: string[] }[] = [
  { offering: "Speakers Lounge Branding",              desc: "Display of sponsor logos and materials in the Speaker Lounge",              tiers: ["Title"] },
  { offering: "Branding During Transitions",           desc: "Video or logo display during breaks and session changes",                   tiers: ["Title"] },
  { offering: "Logo on Event Tickets",                 desc: "Featured branding on official event passes",                               tiers: ["Title", "Platinum"] },
  { offering: "Logo Display on Digital Screens",       desc: "Your brand logo showcased on digital screens across Karachi",              tiers: ["Title", "Platinum"] },
  { offering: "Booth in Main Hall",                    desc: "Branded booth in the main conference hall where all major sessions are held", tiers: ["Title", "Platinum"] },
  { offering: "Mention in Pre-event Blog / Press",     desc: "Recognition in pre-event promotional content and press pieces",            tiers: ["Title", "Platinum", "Gold"] },
  { offering: "Logo on Conference Collateral",         desc: "Printed on Event Cards, T-Shirts, Pens, Bags, Notebooks",                 tiers: ["Title", "Platinum", "Gold"] },
  { offering: "Ad Placement in Conference Booklets",   desc: "Ad space placement according to sponsorship tier",                        tiers: ["Title", "Platinum", "Gold", "Silver"] },
  { offering: "Distribution of Branded Collateral",   desc: "Opportunity to distribute your promotional merchandise",                   tiers: ["Title", "Platinum", "Gold", "Silver", "Bronze"] },
  { offering: "Logo on Conference Website",            desc: "Featured logo with hyperlink on the TEDxClifton website",                 tiers: ["Title", "Platinum", "Gold", "Silver", "Bronze"] },
  { offering: "Social Media Mentions & Coverage",      desc: "Tier-based mentions across TEDxClifton digital platforms",               tiers: ["Title", "Platinum", "Gold", "Silver", "Bronze"] },
  { offering: "Full Venue Branding",                   desc: "Brand presence across halls, entrances, and stage-side (as per tier)",    tiers: ["Title", "Platinum", "Gold", "Silver", "Bronze"] },
  { offering: "Branding on Social Media Posts",        desc: "Announcements and mentions on TEDxClifton social platforms",             tiers: ["Title", "Platinum", "Gold", "Silver", "Bronze"] },
  { offering: "Networking Hub (Exhibit Booth Space)",  desc: "Exclusive access to Networking Hub to engage directly with attendees",    tiers: ["Title", "Platinum", "Gold", "Silver", "Bronze"] },
];

function TiersComparisonTable() {
  return (
    <div className="mt-16 overflow-x-auto rounded-2xl" style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr style={{ background: "hsla(0,0%,100%,0.04)" }}>
            <th className="px-5 py-4 text-left text-[11px] font-bold uppercase text-white/40" style={{ letterSpacing: "0.15em", width: "28%" }}>
              Offering
            </th>
            {TIER_NAMES.map(t => (
              <th key={t} className="px-3 py-4 text-center text-[11px] font-black uppercase" style={{ color: TIER_COLORS[t], letterSpacing: "0.12em" }}>
                {t}
              </th>
            ))}
          </tr>
          <tr>
            <td className="px-5 py-2 text-[10px] text-white/20" style={{ borderTop: "1px solid hsla(0,0%,100%,0.05)" }} />
            {([2500000, 2000000, 1500000, 1000000, 700000] as const).map((p, i) => (
              <td key={i} className="px-3 py-2 text-center text-[10px] font-semibold text-white/30" style={{ borderTop: "1px solid hsla(0,0%,100%,0.05)" }}>
                {p.toLocaleString()} PKR
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIERS_MATRIX.map((row, ri) => (
            <tr
              key={row.offering}
              style={{ borderTop: "1px solid hsla(0,0%,100%,0.05)", background: ri % 2 === 0 ? "transparent" : "hsla(0,0%,100%,0.015)" }}
            >
              <td className="px-5 py-4">
                <div className="text-[12px] font-semibold text-white/80 leading-snug">{row.offering}</div>
                <div className="mt-0.5 text-[10px] leading-snug text-white/30">{row.desc}</div>
              </td>
              {TIER_NAMES.map(t => (
                <td key={t} className="px-3 py-4 text-center">
                  {row.tiers.includes(t) ? (
                    <svg className="mx-auto" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" fill={TIER_COLORS[t]} fillOpacity="0.15" stroke={TIER_COLORS[t]} strokeWidth="1" strokeOpacity="0.5"/>
                      <path d="M4.5 8l2.5 2.5 4.5-5" stroke={TIER_COLORS[t]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-white/10">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
              <h3 className="font-display text-3xl font-light" style={{ color: tier.color }}>
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
        <h2 className="font-display text-4xl font-light mb-2 md:text-5xl">
          Sponsorship <span className="font-black text-[#e62b1e]">Packages</span>
        </h2>
        <Reveal delay={0.05}>
          <p className="text-white/40 text-sm mb-14">Choose the partnership level that best aligns with your brand goals.</p>
        </Reveal>
        <div className="space-y-6">
          {TIERS.map((tier, i) => <TierCard key={tier.name} tier={tier} index={i} />)}
        </div>

        {/* Comparison matrix */}
        <Reveal delay={0.06} className="mt-16">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#e62b1e]">What&apos;s Included</p>
          <p className="text-[13px] text-white/40 mb-4">Full breakdown of benefits by sponsorship tier.</p>
        </Reveal>
        <Reveal delay={0.08}>
          <TiersComparisonTable />
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <GlowCard className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <h3 className="font-display text-2xl font-light mb-1">In-Kind <span className="font-black text-[#e62b1e]">Sponsor</span></h3>
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
        <h2 className="font-display text-4xl font-light md:text-5xl">
          Sponsorship <span className="font-black text-[#e62b1e]">Agreement</span>
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
        <h2 className="font-display text-4xl font-light mb-12 md:text-5xl">
          Contact <span className="font-black text-[#e62b1e]">Details</span>
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
        <MarketingReachSection />
        <SectionDivider />
        <FormerPartnersSection />
        <SectionDivider />
        <ThemeSection />
        <WhyMattersSection />
        <WhyPartnerSection />
        <SectionDivider />
        <AudienceSection />
        <SectionDivider />
        <TiersSection />
        <AgreementSection />
        <ContactSection />
        <KhiNextSection />

        <footer className="border-t border-white/10 bg-[#070103] py-12 px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display text-xl font-bold">
            Next is <span className="font-black text-[#e62b1e]">Now</span>
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
