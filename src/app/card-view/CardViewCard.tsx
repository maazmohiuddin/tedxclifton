"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";

interface Props {
  imgUrl: string;
  alt: string;
  isVip: boolean;
}

export function CardViewCard({ imgUrl, alt, isVip }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Raw mouse position (−0.5 → +0.5 within the card)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const spring = { stiffness: 180, damping: 22, mass: 0.6 };
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-14, 14]), spring);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [10, -10]),  spring);

  // Shine highlight position (0 → 100%)
  const shineX = useMotionValue(50);
  const shineY = useMotionValue(50);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top)  / r.height;
    rawX.set(x - 0.5);
    rawY.set(y - 0.5);
    shineX.set(x * 100);
    shineY.set(y * 100);
  }

  function onMouseLeave() {
    setHovered(false);
    animate(rawX, 0, spring);
    animate(rawY, 0, spring);
    animate(shineX, 50, { duration: 0.4 });
    animate(shineY, 50, { duration: 0.4 });
  }

  const glowRgb = isVip ? "255, 184, 0" : "49, 107, 255";
  const glowSecondary = isVip ? "255, 140, 0" : "100, 150, 255";

  return (
    <div className="relative flex items-center justify-center w-full max-w-[440px] mx-auto">

      {/* ── Ambient pulsing glow behind card ── */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: "-18% -14%",
          borderRadius: "40%",
          background: `radial-gradient(ellipse at 50% 60%,
            rgba(${glowRgb}, 0.45) 0%,
            rgba(${glowSecondary}, 0.18) 45%,
            transparent 70%)`,
          filter: "blur(36px)",
        }}
        animate={{
          scale:   [1, 1.06, 1],
          opacity: [0.65, 1, 0.65],
        }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Hover halo (extra glow ring) ── */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          boxShadow: hovered
            ? `0 0 60px 12px rgba(${glowRgb}, 0.35), 0 0 120px 30px rgba(${glowRgb}, 0.15)`
            : `0 0 30px 4px  rgba(${glowRgb}, 0.15), 0 0  60px 12px rgba(${glowRgb}, 0.07)`,
          transition: "box-shadow 0.4s ease",
        }}
      />

      {/* ── Card with 3-D tilt + spotlight border ── */}
      <SpotlightCard
        glowColor={isVip ? "gold" : "blue"}
        className="rounded-2xl w-full"
      >
      <motion.div
        ref={wrapRef}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformPerspective: 900,
          transformStyle: "preserve-3d",
          width: "100%",
        }}
        initial={{ opacity: 0, scale: 0.90, y: 28 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden shadow-2xl cursor-default select-none"
      >
        {/* Card image */}
        {imgError ? (
          <div className="w-full flex flex-col items-center justify-center gap-3 bg-white/[0.03] rounded-2xl p-12" style={{ aspectRatio: "1 / 1" }}>
            <div className="text-white/20 text-4xl">⚠</div>
            <p className="text-sm text-white/40 text-center">Image unavailable</p>
            <Link href="/card-generator" className="text-xs text-khi-blue-soft hover:text-white transition-colors">
              Generate a new card →
            </Link>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={alt}
            className="w-full h-auto block"
            fetchPriority="high"
            draggable={false}
            onError={() => setImgError(true)}
          />
        )}

        {/* ── Moving shine overlay ── */}
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: useTransform(
              [shineX, shineY],
              ([x, y]) =>
                `radial-gradient(circle at ${x}% ${y}%,
                  rgba(255,255,255,${hovered ? 0.11 : 0.04}) 0%,
                  rgba(255,255,255,0.0) 55%)`,
            ),
          }}
        />

        {/* ── Edge highlight (top rim) ── */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg,
              transparent 0%,
              rgba(${glowRgb}, 0.55) 50%,
              transparent 100%)`,
            opacity: hovered ? 0.9 : 0.4,
            transition: "opacity 0.3s ease",
          }}
        />
      </motion.div>
      </SpotlightCard>
    </div>
  );
}
