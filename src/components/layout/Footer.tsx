import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function Footer() {
  return (
    <footer
      className="border-t border-white/10 bg-white/[0.012]"
      role="contentinfo"
    >
      <Reveal>
        <div className="max-w-page mx-auto px-6 md:px-14 py-12 grid md:grid-cols-3 gap-8 items-center">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block w-7 h-7 rounded-full bg-khi-blue"
              style={{ boxShadow: "0 0 16px rgba(235,0,40,0.5)" }}
            />
            <span className="font-display text-lg font-bold tracking-tight">
              TED<span className="text-khi-blue">x</span>Clifton
            </span>
          </div>
          <p className="text-center text-sm text-white/45 leading-relaxed">
            <em className="text-khi-blue-bright not-italic font-bold" style={{ fontStyle: "italic" }}>NEXT IS NOW</em> — Ideas Worth Spreading.<br />
            Clifton, Karachi · <span className="text-white/30">x = an independently organized TED event</span>
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 justify-center md:justify-end text-sm">
            <li><Link href="/#about" className="text-white/45 hover:text-khi-blue-bright transition-colors">About</Link></li>
            <li><Link href="/#experience" className="text-white/45 hover:text-khi-blue-bright transition-colors">Experience</Link></li>
            <li><Link href="/submit" className="text-white/45 hover:text-khi-blue-bright transition-colors">Speak</Link></li>
            <li><Link href="/testimonials" className="text-white/45 hover:text-khi-blue-bright transition-colors">Testimonials</Link></li>
            <li><Link href="/register" className="text-white/45 hover:text-khi-blue-bright transition-colors">Get Tickets</Link></li>
            <li><Link href="/contact" className="text-white/45 hover:text-khi-blue-bright transition-colors">Contact</Link></li>
          </ul>
        </div>
      </Reveal>
    </footer>
  );
}
