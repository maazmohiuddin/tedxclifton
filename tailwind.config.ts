import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── TEDxClifton brand ──────────────────────────────
        // The `khi` namespace is retained as the internal token name so the
        // existing component classes keep working; the VALUES are TEDxClifton's.
        khi: {
          blue: "#EB0028",        // TED red — the one accent per surface
          "blue-deep": "#B3001E",
          "blue-bright": "#FF1F44",
          "blue-soft": "#FF8A9D",
          ink: "#0A0204",          // near-black canvas (warm hint of maroon)
          "ink-soft": "#000000",
        },
        // TED red, explicit alias
        ted: {
          red: "#EB0028",
          "red-deep": "#B3001E",
          "red-bright": "#FF1F44",
          white: "#F7F7F7",
          black: "#000000",
        },
        // Luxe gold (sub-theme accent)
        gold: {
          DEFAULT: "#E9B872",
          deep: "#C8912F",
          bright: "#F5D08A",
        },
        // Deep maroon for ambient gradient washes (sub-theme)
        maroon: {
          DEFAULT: "#3A0A12",
          deep: "#1A0407",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "Arial", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono:    ["ui-monospace", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.05em",   // brand: headlines at ~-5%
        tighter:  "-0.035em",
        eyebrow:   "0.22em",
      },
      boxShadow: {
        "glow-sm":  "0 0 0 1px rgba(235,0,40,0.24), 0 0 22px rgba(235,0,40,0.24)",
        "glow-md":  "0 0 0 1px rgba(235,0,40,0.42), 0 0 34px rgba(235,0,40,0.52)",
        "glow-cta": "0 0 28px 2px rgba(255,31,68,0.35), 0 6px 28px rgba(235,0,40,0.35)",
        "glow-gold": "0 0 28px 2px rgba(233,184,114,0.30), 0 6px 28px rgba(200,145,47,0.28)",
        "stamp":    "0 4px 4px rgba(0,0,0,0.25)",
      },
      animation: {
        "pulse-dot":    "pulseDot 2s ease-in-out infinite",
        "year-shimmer": "yearShimmer 5s ease-in-out infinite",
        "grid-drift":   "gridDrift 24s linear infinite",
        "hero-float":   "heroFloat 9s ease-in-out infinite",
        "aura":         "kxAura 3.2s ease-in-out infinite",
        "btn-glow":     "btnGlow 3.5s ease-in-out infinite",
        "scroll-cue":   "scrollCue 2.2s ease-in-out infinite",
      },
      keyframes: {
        pulseDot: {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%":     { opacity: "0.45", transform: "scale(0.78)" },
        },
        yearShimmer: {
          "0%,100%": { backgroundPosition: "0% 40%" },
          "50%":     { backgroundPosition: "100% 60%" },
        },
        gridDrift: {
          "0%":   { backgroundPosition: "0 0, 0 0" },
          "100%": { backgroundPosition: "56px 56px, 56px 56px" },
        },
        heroFloat: {
          "0%,100%": { transform: "translate(-50%, 0)" },
          "50%":     { transform: "translate(-50%, -28px)" },
        },
        kxAura: {
          "0%,100%": { opacity: "0.46", filter: "blur(8px)",  transform: "scaleX(0.92)" },
          "50%":     { opacity: "0.9",  filter: "blur(13px)", transform: "scaleX(1.08)" },
        },
        btnGlow: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(235,0,40,0.40), 0 6px 22px rgba(235,0,40,0.32)" },
          "50%":     { boxShadow: "0 0 24px 6px rgba(235,0,40,0.18), 0 6px 22px rgba(235,0,40,0.32)" },
        },
        scrollCue: {
          "0%":      { transform: "scaleY(0.2) translateY(-50%)", transformOrigin: "top" },
          "50%":     { transform: "scaleY(1) translateY(0%)",     transformOrigin: "top" },
          "100%":    { transform: "scaleY(0.2) translateY(50%)",  transformOrigin: "bottom" },
        },
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      maxWidth: {
        page: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
