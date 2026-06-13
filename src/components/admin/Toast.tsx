"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Info } from "lucide-react";

// ── Multi-toast hook ────────────────────────────────────────────

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const add = useCallback((type: ToastItem["type"], message: string) => {
    const id = Math.random().toString(36).slice(2, 10);
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);
  return { toasts, add };
}

export function Toasts({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border max-w-sm pointer-events-auto ${
            t.type === "success"
              ? "bg-[#0a1f16] border-emerald-500/30 text-emerald-300"
              : t.type === "error"
              ? "bg-[#1f0a0a] border-red-500/30 text-red-300"
              : "bg-[#090f20] border-khi-blue/30 text-blue-300"
          }`}
        >
          {t.type === "success" && <CheckCircle size={14} className="flex-shrink-0" />}
          {t.type === "error"   && <XCircle     size={14} className="flex-shrink-0" />}
          {t.type === "info"    && <Info        size={14} className="flex-shrink-0" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── Single centered animated toast ─────────────────────────────

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
}

const CONFIG: Record<ToastType, { icon: React.ElementType; dot: string; border: string; glow: string }> = {
  success: { icon: CheckCircle, dot: "#51FFD5", border: "rgba(81,255,213,0.45)", glow: "rgba(81,255,213,0.25)" },
  error:   { icon: XCircle,     dot: "#FF6B8E", border: "rgba(255,107,142,0.45)", glow: "rgba(255,107,142,0.25)" },
  info:    { icon: Info,        dot: "#4579FF", border: "rgba(49,107,255,0.55)",  glow: "rgba(49,107,255,0.32)"  },
};

export function Toast({ message, type = "info" }: ToastProps) {
  const { dot, border, glow } = CONFIG[type];
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ y: 24, opacity: 0, x: "-50%", scale: 0.92 }}
      animate={{ y: 0,  opacity: 1, x: "-50%", scale: 1    }}
      exit={{ y: 16,    opacity: 0, x: "-50%", scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-7 left-1/2 z-[1100] inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-sm text-white bg-khi-ink/95 backdrop-blur-xl"
      style={{
        border: `1px solid ${border}`,
        boxShadow: `0 14px 40px rgba(0,0,0,0.5), 0 0 28px ${glow}`,
      }}
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot, boxShadow: `0 0 10px ${dot}` }} />
      {message}
    </motion.div>
  );
}
