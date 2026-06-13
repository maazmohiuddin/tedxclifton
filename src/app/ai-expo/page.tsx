import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Speakers — TEDxClifton",
  description:
    "The TEDxClifton speaker line-up is coming soon. A day of Ideas Worth Spreading in Clifton, Karachi.",
};

export default function SpeakersPage() {
  return (
    <>
      <PageHero
        eyebrow="TEDxClifton"
        title={<>Speakers <span className="kx-accent">coming soon.</span></>}
      >
        We&apos;re curating a line-up of thinkers, makers and storytellers for the
        TEDxClifton stage. Speaker announcements are on the way.
      </PageHero>

      <section className="kx-section text-center">
        <Reveal>
          <p className="mx-auto max-w-[560px] text-white/60 leading-relaxed">
            Ideas Worth Spreading — 18 minutes at a time. Check back soon to meet
            the voices taking the stage in Clifton, Karachi.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/" className="kx-btn-outline">
              Back to home
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
