"use client";

import { Reveal } from "@/components/ui/Reveal";

export function About() {
  return (
    <section aria-labelledby="about-title" className="kx-section">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="kx-eyebrow mb-5">About</p>
            <h2
              id="about-title"
              className="font-display text-[clamp(34px,5vw,60px)] font-extrabold text-white"
              style={{ letterSpacing: "-0.04em", lineHeight: 1.04 }}
            >
              Ideas worth spreading — <span className="kx-accent">in Clifton.</span>
            </h2>
          </Reveal>
        </div>

        <div className="lg:col-span-7 space-y-5 text-[15px] md:text-base text-white/60 leading-relaxed">
          <Reveal delay={0.05}>
            <p>
              In the spirit of ideas worth spreading, TED has created a program called TEDx — local,
              self-organized events that bring people together to share a TED-like experience.
              <span className="text-white"> TEDxClifton</span> is one of them: an independently organized TED
              event held in Clifton, Karachi, where the brightest voices take the stage for talks of
              18 minutes or less.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p>
              Our last edition — <span className="text-white">&ldquo;Breaking Boundaries&rdquo;</span> — became one of the most
              talked-about TEDx events in Pakistan: <span className="text-white">1,000+ attendees</span> and a guest
              list of <span className="text-white">200+ CEOs and industry leaders</span>, with an international, former
              official TED speaker calling it &ldquo;a globally competitive TEDx experience that sets a new
              benchmark for Pakistan.&rdquo;
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <blockquote className="mt-7 border-l-2 border-khi-blue pl-5 text-white/80 italic">
              &ldquo;We don&apos;t just talk about change — we celebrate those who create it.&rdquo;
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
