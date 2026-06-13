import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Get Tickets — TEDxClifton",
  description: "Reserve your seat for TEDxClifton — Next is Now. A day of bold talks and big ideas in Clifton, Karachi.",
};

export default function RegisterPage() {
  return (
    <>
      <PageHero
        eyebrow="Next is Now · Clifton, Karachi"
        title={<>Reserve your <span className="kx-accent">seat.</span></>}
      >
        Join us for a day of ideas worth spreading. Tell us a little about yourself and
        we&apos;ll confirm your ticket by email.
      </PageHero>

      <section className="kx-section pt-4 md:pt-6">
        <RegisterForm />
      </section>
    </>
  );
}
