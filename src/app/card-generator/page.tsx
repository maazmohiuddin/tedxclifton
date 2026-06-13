import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Card Generator Closed — TEDxClifton",
  description: "The TEDxClifton digital card generator is no longer available. Stay tuned for TEDxClifton.",
};

export default function CardGeneratorPage() {
  return (
    <>
      <PageHero
        eyebrow="Digital Card · Closed"
        title={<>Card Generator <span className="kx-accent">Closed</span></>}
      >
        The TEDxClifton digital attendance card is no longer available. A new card for TEDxClifton will launch with the next edition.
      </PageHero>

      <section className="kx-section">
        <Reveal>
          <div className="max-w-[560px] mx-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 md:p-12 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/50 tracking-wide uppercase mb-8">
              <Lock size={12} className="opacity-70" aria-hidden="true" />
              Card generator closed
            </span>

            <h2 className="font-display font-extrabold text-white text-2xl md:text-3xl mb-4" style={{ letterSpacing: "-0.04em" }}>
              See you at TEDxClifton
            </h2>
            <p className="text-white/50 text-sm md:text-base leading-relaxed mb-8">
              The TEDxClifton AI Summit has concluded. The digital attendance card for the next edition will be available when TEDxClifton registration opens in 2026.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-khi-blue hover:text-white transition-colors duration-200"
            >
              Back to homepage
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
