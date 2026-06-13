import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  title: "Apply to Speak — TEDxClifton",
  description: "Have an idea worth spreading? Pitch your talk for the TEDxClifton stage. Our curation team reviews every proposal.",
};

export default function SubmitPage() {
  return (
    <>
      <PageHero
        eyebrow="Call for Speakers"
        title={<>Apply to <span className="kx-accent">speak.</span></>}
      >
        The TEDxClifton stage is open. If you have one idea worth spreading, pitch it below —
        every proposal is read by our curation team.
      </PageHero>

      <section className="kx-section pt-4 md:pt-6">
        <SubmitForm />
      </section>
    </>
  );
}
