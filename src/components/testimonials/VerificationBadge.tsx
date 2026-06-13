import { BadgeCheck, Crown, Users } from "lucide-react";
import type { VerificationTier } from "@/lib/types";
import { VERIFICATION_LABELS } from "@/lib/types";

const STYLES: Record<
  VerificationTier,
  { text: string; bg: string; border: string; Icon: typeof BadgeCheck }
> = {
  vip: {
    text: "#FFD06B",
    bg: "rgba(255,184,0,0.10)",
    border: "rgba(255,184,0,0.36)",
    Icon: Crown,
  },
  attendee: {
    text: "#8FAFFF",
    bg: "rgba(49,107,255,0.10)",
    border: "rgba(49,107,255,0.36)",
    Icon: BadgeCheck,
  },
  community: {
    text: "rgba(255,255,255,0.55)",
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.12)",
    Icon: Users,
  },
};

export function VerificationBadge({
  tier,
  size = "md",
}: {
  tier: VerificationTier;
  size?: "sm" | "md";
}) {
  const s = STYLES[tier];
  const Icon = s.Icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  const icon = size === "sm" ? 11 : 13;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${pad}`}
      style={{ color: s.text, background: s.bg, borderColor: s.border }}
    >
      <Icon size={icon} aria-hidden="true" />
      {VERIFICATION_LABELS[tier]}
    </span>
  );
}
