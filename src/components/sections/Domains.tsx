"use client";

import {
  Lightbulb, Mic, Users, HeartHandshake, Sparkles, Rocket,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { MouseTilt } from "@/components/ui/MouseTilt";
import { DOMAINS } from "@/lib/types";

const ICONS = {
  ideas:      Lightbulb,
  talks:      Mic,
  speakers:   Users,
  community:  HeartHandshake,
  experience: Sparkles,
  impact:     Rocket,
} as const;

export function Domains() {
  return (
    <section
      aria-labelledby="domains-title"
      className="kx-section"
    >
      <Reveal>
        <p className="kx-eyebrow mb-5">The Experience</p>
        <h2
          id="domains-title"
          className="font-display text-[clamp(34px,5vw,64px)] font-extrabold text-white max-w-[760px]"
          style={{ letterSpacing: "-0.04em", lineHeight: 1.04 }}
        >
          More than a conference — <span className="kx-accent">a movement.</span>
        </h2>
        <p className="mt-5 max-w-[560px] text-white/55 leading-relaxed">
          TEDxClifton is a stage for ideas worth spreading — a day built around bold talks,
          remarkable people, and the conversations that turn inspiration into action.
        </p>
      </Reveal>

      <ul className="mt-14 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DOMAINS.map((d, i) => {
          const Icon = ICONS[d.key as keyof typeof ICONS] ?? Sparkles;
          return (
            <Reveal as="li" key={d.key} delay={i * 0.05}>
              <MouseTilt max={6} scale={1.015}>
                <article
                  className="kx-card group h-full focus-within:border-blue-lit relative overflow-hidden"
                  tabIndex={0}
                  aria-label={d.title}
                >
                  {/* hover halo */}
                  <div
                    aria-hidden="true"
                    className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle, ${d.color}33 0%, transparent 70%)`,
                      filter: "blur(20px)",
                    }}
                  />
                  {/* index */}
                  <span
                    className="absolute top-5 right-6 font-display font-extrabold text-white/[0.06] text-5xl select-none"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="relative flex items-center gap-3.5 mb-4">
                    <div
                      className="grid place-items-center w-12 h-12 rounded-xl transition-all duration-300 ease-soft group-hover:scale-110 group-hover:-rotate-6"
                      style={{
                        background: `${d.color}1F`,
                        border: `1px solid ${d.color}55`,
                        boxShadow: `0 0 22px ${d.color}33, inset 0 1px 0 ${d.color}55`,
                      }}
                      aria-hidden="true"
                    >
                      <Icon size={20} style={{ color: d.color }} strokeWidth={1.8} />
                    </div>
                    <h3 className="font-display text-base font-semibold text-white -tracking-tight">
                      {d.title}
                    </h3>
                  </div>
                  <p className="relative text-sm text-white/55 leading-relaxed">
                    {d.desc}
                  </p>

                  {/* bottom accent line */}
                  <div
                    aria-hidden="true"
                    className="absolute left-6 right-6 bottom-0 h-px scale-x-0 origin-left transition-transform duration-500 ease-soft group-hover:scale-x-100"
                    style={{
                      background: `linear-gradient(90deg, ${d.color}, transparent)`,
                    }}
                  />
                </article>
              </MouseTilt>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
