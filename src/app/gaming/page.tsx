import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Coming soon — TEDxClifton",
  description:
    "Something new is on the way from TEDxClifton — an independently organized TED event in Clifton, Karachi.",
};

export default function ComingSoonPage() {
  return (
    <>
      <PageHero
        eyebrow="TEDxClifton"
        title={<>Coming <span className="kx-accent">soon.</span></>}
      >
        We&apos;re working on something new for TEDxClifton. More details will be
        shared here shortly.
      </PageHero>

      <section className="kx-section text-center">
        <Reveal>
          <p className="mx-auto max-w-[560px] text-white/60 leading-relaxed">
            In the meantime, explore the rest of TEDxClifton — a day built around
            Ideas Worth Spreading in Clifton, Karachi.
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
