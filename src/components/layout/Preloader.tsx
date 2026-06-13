"use client";

import { useEffect, useState } from "react";

/**
 * Branded preloader. Shows on first paint, fades out once:
 *   • document.readyState === "complete", OR
 *   • a short timeout elapses (whichever is first)
 * Only fires on full page loads — not on client-side navigation.
 * Respects prefers-reduced-motion.
 */
export function Preloader() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      setProgress(100);
      window.setTimeout(() => setShow(false), reduced ? 0 : 380);
    };

    const tick = window.setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 18 + 6, 92));
    }, 80);

    const maxWait = window.setTimeout(finish, reduced ? 200 : 600);

    const onLoad = () => {
      window.clearInterval(tick);
      window.clearTimeout(maxWait);
      finish();
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(maxWait);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      role="status"
      className={`fixed inset-0 z-[1000] grid place-items-center transition-opacity duration-500 ease-soft ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #2a0a12 0%, #000000 62%)",
      }}
    >
      <div className="flex flex-col items-center gap-7">
        {/* TED red dot with glow */}
        <div className="relative grid place-items-center">
          <div
            aria-hidden="true"
            className="absolute inset-[-40px] rounded-full animate-pulse-slow"
            style={{
              background: "radial-gradient(ellipse at center, rgba(235,0,40,0.5) 0%, transparent 65%)",
              filter: "blur(22px)",
            }}
          />
          <div className="animate-mark-float relative">
            <div
              className="w-20 h-20 rounded-full"
              style={{
                background: "#EB0028",
                boxShadow: "0 8px 32px rgba(235,0,40,0.55)",
              }}
            />
          </div>
        </div>

        {/* Wordmark */}
        <div className="font-display text-3xl font-extrabold text-white -tracking-tight">
          TED<span className="text-khi-blue">x</span>Clifton
        </div>

        {/* Progress */}
        <div className="w-[200px] relative">
          <div className="h-[2px] rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full transition-[width] duration-200 ease-soft"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #EB0028 0%, #F5D08A 100%)",
                boxShadow: "0 0 12px rgba(235,0,40,0.6)",
              }}
            />
          </div>
          <div
            className="mt-3 text-[10px] uppercase text-white/30 text-center"
            style={{ letterSpacing: "0.28em" }}
          >
            Ideas worth spreading
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes markFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-7px) scale(1.03); }
        }
        :global(.animate-mark-float) { animation: markFloat 2.6s ease-in-out infinite; }

        @keyframes pulseSlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.9; transform: scale(1.1); }
        }
        :global(.animate-pulse-slow) { animation: pulseSlow 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
