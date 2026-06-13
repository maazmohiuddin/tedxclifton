import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ContactForm } from "./ContactForm";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Contact — TEDxClifton",
  description: "Get in touch with the TEDxClifton team. Questions about registration, sponsorship, speaking, or anything else.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title={<>Say <span className="kx-accent">hello.</span></>}
      >
        Questions about registration, sponsorship, VIP access, or speaking at TEDxClifton?
        Drop us a message and we&apos;ll get back to you within 24 hours.
      </PageHero>

      <section className="kx-section">
        <Reveal>
          <ContactForm />
        </Reveal>
      </section>
    </>
  );
}
