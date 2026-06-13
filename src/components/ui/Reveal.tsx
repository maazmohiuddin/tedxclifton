"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Scroll-triggered fade-up wrapper.
 * - 22px slide + 0.96 → 1 scale
 * - 0.7s soft ease
 * - Animates the first time it enters the viewport
 * - Respects reduced-motion preference
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[As as "div"] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={reduced ? false : { opacity: 0, y: 22, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
