"use client";

export type LiveStatus = "connecting" | "live" | "down";

export function LiveBadge({ status }: { status: LiveStatus }) {
  const cfg = {
    live: {
      label: "Live",
      title: "Realtime connected — new data appears instantly.",
      dot: "#51FFD5",
      bg: "rgba(81,255,213,0.10)",
      border: "rgba(81,255,213,0.32)",
      text: "#51FFD5",
      pulse: true,
    },
    connecting: {
      label: "Connecting",
      title: "Opening realtime connection…",
      dot: "rgba(255,255,255,0.55)",
      bg: "rgba(255,255,255,0.06)",
      border: "rgba(255,255,255,0.18)",
      text: "rgba(255,255,255,0.65)",
      pulse: true,
    },
    down: {
      label: "Offline",
      title: "Realtime disconnected — refresh to reconnect.",
      dot: "#FF6B8E",
      bg: "rgba(255,107,142,0.10)",
      border: "rgba(255,107,142,0.32)",
      text: "#FF6B8E",
      pulse: false,
    },
  }[status];

  return (
    <span
      role="status"
      aria-live="polite"
      title={cfg.title}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase border"
      style={{
        color: cfg.text,
        background: cfg.bg,
        borderColor: cfg.border,
        letterSpacing: "0.14em",
      }}
    >
      <span aria-hidden="true" className="relative grid place-items-center w-2 h-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
        {cfg.pulse && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: cfg.dot, opacity: 0.55 }}
          />
        )}
      </span>
      {cfg.label}
    </span>
  );
}
