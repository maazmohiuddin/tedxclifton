import { Hero } from "@/components/sections/Hero";
import { EventDates } from "@/components/sections/EventDates";
import { About } from "@/components/sections/About";
import { Stats } from "@/components/sections/Stats";
import { Domains } from "@/components/sections/Domains";
import { Partners } from "@/components/sections/Partners";
import { TestimonialsSlider } from "@/components/sections/TestimonialsSlider";
import { RegisterCTA } from "@/components/sections/RegisterCTA";
import { getApprovedTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const testimonials = await getApprovedTestimonials(24);

  return (
    <>
      <Hero />
      <EventDates />
      <div id="about">
        <About />
      </div>
      <Stats />
      <div id="experience">
        <Domains />
      </div>
      <div id="partners">
        <Partners />
      </div>
      {testimonials.length > 0 && (
        <div id="testimonials">
          <TestimonialsSlider items={testimonials} />
        </div>
      )}
      <RegisterCTA />
    </>
  );
}
