"use client";

import { useRef, useEffect, ReactNode, CSSProperties } from "react";

/**
 * CSS-only 3D tilt. Reads mouse position relative to the wrapper and
 * applies a perspective + rotateX/rotateY transform via CSS vars on the
 * inner element. No JS in the hot path during animation — the transform
 * is applied with a CSS transition. Drops to no-op on touch / reduced-motion.
 */
export function MouseTilt({
  children,
  max = 8,
  scale = 1.02,
  className,
  style,
}: {
  children: ReactNode;
  max?: number;       // max degrees of rotation
  scale?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -2 * max;
      const ry = (px - 0.5) *  2 * max;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        inner.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale})`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(rafId);
      inner.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    };
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, [max, scale]);

  return (
    <div ref={wrapRef} className={className} style={{ ...style, perspective: 900 }}>
      <div
        ref={innerRef}
        style={{
          transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
