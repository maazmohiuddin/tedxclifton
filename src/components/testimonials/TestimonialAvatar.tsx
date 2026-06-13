import Image from "next/image";
import type { VerificationTier } from "@/lib/types";

/** Ring treatment per tier — VIP gets a premium gold ring, attendees a brand accent. */
const RING: Record<VerificationTier, string> = {
  vip: "bg-gradient-to-br from-[#FFD06B] via-[#F5A623] to-[#FFD06B] shadow-[0_0_22px_rgba(255,184,0,0.45)]",
  attendee: "bg-gradient-to-br from-khi-blue-bright via-khi-blue to-khi-blue-deep shadow-[0_0_18px_rgba(49,107,255,0.4)]",
  community: "bg-white/15",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}

export function TestimonialAvatar({
  name,
  src,
  tier,
  size = 56,
}: {
  name: string;
  src: string | null;
  tier: VerificationTier;
  size?: number;
}) {
  const ringPad = tier === "community" ? 1.5 : 2.5;
  const inner = size - ringPad * 2;

  return (
    <div
      className={`relative shrink-0 rounded-full p-[2px] ${RING[tier]}`}
      style={{ width: size, height: size, padding: ringPad }}
    >
      <div
        className="relative rounded-full overflow-hidden bg-khi-ink grid place-items-center"
        style={{ width: inner, height: inner }}
      >
        {src ? (
          <Image src={src} alt={name} fill className="object-cover" sizes={`${size}px`} />
        ) : (
          <span
            className="font-display font-extrabold text-white/80 select-none"
            style={{ fontSize: inner * 0.36 }}
            aria-hidden="true"
          >
            {initials(name)}
          </span>
        )}
      </div>
    </div>
  );
}
