"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

// NOTE: replace these with TEDxClifton's actual partner / sponsor logos.
const PARTNERS = [
  { name: "TFS Events",              src: "/partners/TFS Logo White.png" },
  { name: "JBS Works Better",        src: "/partners/JBS Logo White.png" },
  { name: "VIPER",                   src: "/partners/Viper Logo White.png" },
  { name: "LOUG Executive Forum",    src: "/partners/LOUG Executive Forum Logo.png" },
  { name: "LYZR",                    src: "/partners/LYZR Logo.png" },
  { name: "GEN Pakistan",            src: "/partners/GEN Pakistan Logo.png" },
  { name: "TRINT",                   src: "/partners/TRINT Logo.png" },
  { name: "WHS",                     src: "/partners/WHS Logo.png" },
  { name: "THE BOTSS",               src: "/partners/Bots Logo White.png" },
  { name: "Broadway Pizza",          src: "/partners/Broadway Pizza Logo.png" },
  { name: "CEO Today Magazine",      src: "/partners/CEO Today Magazine.png" },
  { name: "DO Advertising",          src: "/partners/DO Advertising Logo White.png" },
  { name: "Global Business Network", src: "/partners/Global Business Network Logo White.png" },
  { name: "HKHM",                    src: "/partners/HKHM Logo Vectorized.png" },
  { name: "IGLOO",                   src: "/partners/Igloo Logo.png" },
  { name: "Istanbul",                src: "/partners/Istanbul Taste of Turkey Logo White.png" },
  { name: "KFC",                     src: "/partners/KFC Logo.png" },
  { name: "LOUG",                    src: "/partners/LOUG Logo White.png" },
  { name: "Olymtech",                src: "/partners/Olymtech Logo.png" },
  { name: "PAFLA",                   src: "/partners/PAFLA Logo.png" },
  { name: "Padel Walay Loug",        src: "/partners/Padel Walay Loug Logo.png" },
  { name: "Pakola",                  src: "/partners/Pakola Products Logo.png" },
  { name: "Server4Sale",             src: "/partners/S4S Logo White.png" },
  { name: "Partner",                 src: "/partners/At Symbol Red Logo White.png" },
  { name: "Partner",                 src: "/partners/Dark Logo White.png" },
  { name: "Partner",                 src: "/partners/Green E Bracket Logo White.png" },
  { name: "Partner",                 src: "/partners/My Logo Green White.png" },
  { name: "Partner",                 src: "/partners/Orange A Bubble Icon.png" },
  { name: "Partner",                 src: "/partners/Pink Accent Logo White.png" },
  { name: "Partner",                 src: "/partners/Pink Pixel Logo White.png" },
];

const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const gridItem = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function Partners() {
  const reduced = useReducedMotion();

  return (
    <section aria-labelledby="partners-title" className="kx-section">
      <Reveal>
        <div className="text-center max-w-[600px] mx-auto">
          <p className="kx-eyebrow justify-center mb-5">Partners &amp; Sponsors</p>
          <h2
            id="partners-title"
            className="font-display text-[clamp(32px,4.5vw,52px)] font-extrabold text-white"
            style={{ letterSpacing: "-0.04em", lineHeight: 1.06 }}
          >
            Powered by our <span className="kx-accent">partners.</span>
          </h2>
          <p className="mt-5 text-white/55 leading-relaxed">
            TEDxClifton is made possible by partners and sponsors who believe in the power
            of ideas worth spreading.
          </p>
        </div>
      </Reveal>

      <motion.ul
        className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 border border-white/10 rounded-2xl overflow-hidden bg-white/[0.012]"
        aria-label="TEDxClifton partner logos"
        variants={reduced ? undefined : gridContainer}
        initial={reduced ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {PARTNERS.map((p, i) => {
          const cols = 5;
          const isLastRow = i >= PARTNERS.length - (PARTNERS.length % cols || cols);
          return (
            <motion.li
              key={`${p.src}-${i}`}
              variants={reduced ? undefined : gridItem}
              className={[
                "flex items-center justify-center min-h-[110px] px-6 py-5",
                "hover:bg-khi-blue/[0.06] transition-colors duration-300",
                (i + 1) % cols !== 0 ? "border-r border-white/10" : "",
                !isLastRow ? "border-b border-white/10" : "",
              ].join(" ")}
            >
              <div className="relative w-full h-14">
                <Image
                  src={p.src}
                  alt={p.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
