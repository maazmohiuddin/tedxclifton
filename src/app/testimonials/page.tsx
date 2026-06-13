import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Testimonials } from "@/components/sections/Testimonials";
import { TestimonialForm } from "./TestimonialForm";
import { getApprovedTestimonials } from "@/lib/testimonials";

export const metadata: Metadata = {
  title: "Testimonials — TEDxClifton",
  description: "Read what attendees, speakers, and the community had to say about TEDxClifton, and share your own experience.",
};

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const testimonials = await getApprovedTestimonials();

  return (
    <>
      <PageHero eyebrow="TEDxClifton" title={<>Share your <span className="kx-accent">experience</span></>}>
        Were you part of TEDxClifton? Tell us what it meant to you. Verified attendees and VIPs
        receive a badge of authenticity on their testimonial.
      </PageHero>

      <section className="kx-section" aria-labelledby="testimonial-form-title">
        <h2 id="testimonial-form-title" className="sr-only">Submit a testimonial</h2>
        <TestimonialForm />
      </section>

      {testimonials.length > 0 && <Testimonials items={testimonials} />}
    </>
  );
}
