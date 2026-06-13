"use client";

import React, { useEffect, useRef, ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "blue" | "gold";
}

const hueMap = {
  blue: { base: 220, spread: 160 },
  gold: { base: 42,  spread: 20  },
};

export function SpotlightCard({
  children,
  className = "",
  glowColor = "blue",
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const uid = useRef(`sc-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const el = cardRef.current;
      if (!el) return;
      el.style.setProperty("--x",  e.clientX.toFixed(1));
      el.style.setProperty("--y",  e.clientY.toFixed(1));
      el.style.setProperty("--xp", (e.clientX / window.innerWidth).toFixed(3));
      el.style.setProperty("--yp", (e.clientY / window.innerHeight).toFixed(3));
    };
    document.addEventListener("pointermove", syncPointer);
    return () => document.removeEventListener("pointermove", syncPointer);
  }, []);

  const { base, spread } = hueMap[glowColor];

  // Saturation/lightness tuned per color
  const sat = glowColor === "gold" ? 95 : 100;
  const lit = glowColor === "gold" ? 62 : 68;

  const css = `
    #${uid}::before,
    #${uid}::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: -2px;
      border: 2px solid transparent;
      border-radius: inherit;
      background-attachment: fixed;
      background-size: calc(100% + 4px) calc(100% + 4px);
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent),
            linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
      -webkit-mask: linear-gradient(transparent, transparent),
                    linear-gradient(white, white);
      -webkit-mask-clip: padding-box, border-box;
      -webkit-mask-composite: destination-in;
    }
    #${uid}::before {
      background-image: radial-gradient(
        300px 300px at calc(var(--x,0) * 1px) calc(var(--y,0) * 1px),
        hsl(calc(${base} + var(--xp,0) * ${spread}) ${sat}% ${lit}% / 0.9),
        transparent 100%
      );
      filter: brightness(1.6);
    }
    #${uid}::after {
      background-image: radial-gradient(
        180px 180px at calc(var(--x,0) * 1px) calc(var(--y,0) * 1px),
        hsl(0 0% 100% / 0.55),
        transparent 100%
      );
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        id={uid}
        ref={cardRef}
        className={`relative ${className}`}
        style={{ position: "relative" }}
      >
        {children}
      </div>
    </>
  );
}
