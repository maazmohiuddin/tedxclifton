import { Quote } from "lucide-react";
import type { PublicTestimonial } from "@/lib/types";
import { TestimonialAvatar } from "./TestimonialAvatar";
import { VerificationBadge } from "./VerificationBadge";
import { StarRating } from "@/components/ui/StarRating";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function TestimonialCard({
  t,
  featured = false,
  clamp = false,
}: {
  t: PublicTestimonial;
  featured?: boolean;
  /** Truncate the body to a fixed number of lines so cards stay uniform height. */
  clamp?: boolean;
}) {
  const isVip = t.verification === "vip";

  return (
    <figure
      className={[
        "relative flex flex-col rounded-2xl border bg-white/[0.025] p-6 md:p-7 h-full transition-colors duration-300",
        featured ? "md:p-8" : "",
        isVip
          ? "border-[rgba(255,184,0,0.28)] hover:border-[rgba(255,184,0,0.5)]"
          : "border-white/10 hover:border-khi-blue/40",
      ].join(" ")}
    >
      {/* VIP ambient glow */}
      {isVip && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-2xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,184,0,0.08) 0%, transparent 70%)" }}
        />
      )}

      <Quote
        size={featured ? 34 : 26}
        aria-hidden="true"
        className={isVip ? "text-[#FFD06B]/40" : "text-khi-blue/40"}
        fill="currentColor"
      />

      {t.rating != null && (
        <div className="mt-3">
          <StarRating value={t.rating} size={featured ? 18 : 16} />
        </div>
      )}

      <blockquote
        className={[
          "mt-4 text-white/80 leading-relaxed flex-1",
          featured ? "text-lg md:text-xl" : "text-[15px]",
          clamp ? "kx-clamp" : "",
        ].join(" ")}
      >
        {t.body}
      </blockquote>

      <figcaption className="mt-6 pt-5 border-t border-white/[0.08] flex items-center gap-3.5">
        <TestimonialAvatar name={t.full_name} src={t.avatar_url} tier={t.verification} size={featured ? 60 : 52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-white truncate">{t.full_name}</span>
          </div>
          {(t.designation || t.company) && (
            <p className="text-xs text-white/45 truncate mt-0.5">
              {t.designation}
              {t.designation && t.company ? " · " : ""}
              {t.company}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <VerificationBadge tier={t.verification} size="sm" />
            <span className="text-[10px] text-white/25">{fmtDate(t.created_at)}</span>
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
