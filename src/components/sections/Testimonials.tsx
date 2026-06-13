"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicTestimonial } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";

export function Testimonials({
  items,
  showHeader = true,
}: {
  items: PublicTestimonial[];
  showHeader?: boolean;
}) {
  const featured = items.filter(t => t.featured);
  const rest = items.filter(t => !t.featured);
  const carouselRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  function scroll(dir: 1 | -1) {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  }

  return (
    <section aria-labelledby="testimonials-title" className="kx-section">
      {showHeader && (
        <Reveal>
          <div className="text-center max-w-[640px] mx-auto">
            <p className="kx-eyebrow justify-center mb-5">Voices of TEDxClifton</p>
            <h2
              id="testimonials-title"
              className="font-display text-[clamp(32px,4.5vw,52px)] font-extrabold text-white"
              style={{ letterSpacing: "-0.035em", lineHeight: 1.06 }}
            >
              What attendees <span className="kx-accent">are saying.</span>
            </h2>
            <p className="mt-5 text-white/55 leading-relaxed">
              Real feedback from verified attendees, VIPs, and the wider TEDxClifton community.
            </p>
          </div>
        </Reveal>
      )}

      {/* Featured carousel */}
      {featured.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFD06B]/80">Featured</p>
            {featured.length > 1 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => scroll(-1)}
                  aria-label="Previous featured testimonials"
                  className="grid place-items-center w-9 h-9 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-khi-blue/50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scroll(1)}
                  aria-label="Next featured testimonials"
                  className="grid place-items-center w-9 h-9 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-khi-blue/50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
          <div
            ref={carouselRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-2"
            style={{ scrollbarWidth: "none" }}
          >
            {featured.map(t => (
              <div
                key={t.id}
                className="snap-start shrink-0 w-[88%] sm:w-[480px] md:w-[560px]"
              >
                <TestimonialCard t={t} featured />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {rest.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((t, i) => (
            <Reveal key={t.id} delay={Math.min(i * 0.04, 0.3)}>
              <TestimonialCard t={t} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
