"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { PublicTestimonial } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";

const AUTOPLAY_MS = 5000;

export function TestimonialsSlider({ items }: { items: PublicTestimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);

  // Featured first, then newest — same ordering as the data layer.
  const slides = items;

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.children;
    if (cards.length === 0) return;
    const clamped = ((index % cards.length) + cards.length) % cards.length;
    const card = cards[clamped] as HTMLElement;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      setActive(prev => {
        const next = ((prev + dir) % slides.length + slides.length) % slides.length;
        scrollToIndex(next);
        return next;
      });
    },
    [slides.length, scrollToIndex],
  );

  // Autoplay — paused on hover, focus, or when the tab is hidden.
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, slides.length, go]);

  // Keep the active dot in sync when the user scrolls/swipes manually.
  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let min = Infinity;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft - track.offsetLeft + card.clientWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < min) {
        min = dist;
        nearest = i;
      }
    });
    setActive(nearest);
  }

  if (slides.length === 0) return null;

  return (
    <section aria-labelledby="home-testimonials-title" className="kx-section">
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-[560px]">
            <p className="kx-eyebrow mb-5">Voices of TEDxClifton</p>
            <h2
              id="home-testimonials-title"
              className="font-display text-[clamp(30px,4.2vw,48px)] font-extrabold text-white"
              style={{ letterSpacing: "-0.035em", lineHeight: 1.06 }}
            >
              What attendees <span className="kx-accent">are saying.</span>
            </h2>
            <p className="mt-5 text-white/55 leading-relaxed">
              Real feedback from verified attendees, VIPs, and the wider TEDxClifton community.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {slides.length > 1 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous testimonial"
                  className="grid place-items-center w-10 h-10 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-khi-blue/50 transition-colors"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next testimonial"
                  className="grid place-items-center w-10 h-10 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-khi-blue/50 transition-colors"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
            <Link href="/testimonials" className="kx-btn-primary !py-2.5 !px-5 !text-[13px]">
              View all
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Autoplay slider */}
      <div
        className="mt-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {slides.map(t => (
            <div
              key={t.id}
              className="snap-start shrink-0 w-[86%] sm:w-[48%] lg:w-[31.5%]"
            >
              <TestimonialCard t={t} clamp />
            </div>
          ))}
        </div>

        {/* Dots */}
        {slides.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {slides.map((t, i) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === active}
                onClick={() => {
                  setActive(i);
                  scrollToIndex(i);
                }}
                className="group p-1.5"
              >
                <motion.span
                  className="block rounded-full"
                  animate={{
                    width: i === active ? 22 : 7,
                    backgroundColor: i === active ? "#4579FF" : "rgba(255,255,255,0.22)",
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: 7 }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
