"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Download, Lock, Loader2 } from "lucide-react";
import { PROPOSAL_PAGES, PROPOSAL_PDF_NAME } from "./pages";

/** Fetch an image and return it as a data URL (or null if it doesn't exist). */
async function fetchAsDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function Slide({
  src,
  alt,
  index,
  reduced,
  onResolved,
}: {
  src: string;
  alt: string;
  index: number;
  reduced: boolean;
  onResolved: (ok: boolean) => void;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) return null;

  return (
    <motion.figure
      initial={reduced ? false : { opacity: 0, y: 42 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full overflow-hidden rounded-xl shadow-[0_24px_70px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={index < 2 ? "eager" : "lazy"}
        onLoad={() => onResolved(true)}
        onError={() => {
          setErrored(true);
          onResolved(false);
        }}
        className="block h-auto w-full select-none"
        draggable={false}
      />
      <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/70 backdrop-blur">
        {String(index + 1).padStart(2, "0")}
      </span>
    </motion.figure>
  );
}

export function ProposalViewer() {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState(0);
  const [okCount, setOkCount] = useState(0);

  const total = PROPOSAL_PAGES.length;
  const noneAvailable = resolved >= total && okCount === 0;

  function handleResolved(ok: boolean) {
    setResolved((r) => r + 1);
    if (ok) setOkCount((c) => c + 1);
  }

  async function downloadPdf() {
    if (busy) return;
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();

      let added = 0;
      for (const page of PROPOSAL_PAGES) {
        const dataUrl = await fetchAsDataURL(page.src);
        if (!dataUrl) continue;
        const fmt = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        if (added > 0) doc.addPage();
        doc.addImage(dataUrl, fmt, 0, 0, w, h, undefined, "FAST");
        added += 1;
      }

      if (added === 0) {
        alert("The proposal pages haven't been added yet.");
        return;
      }
      doc.save(PROPOSAL_PDF_NAME);
    } catch (e) {
      console.error(e);
      alert("Couldn't generate the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    await fetch("/api/proposal/unlock", { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#070103] text-white">
      {/* scroll progress */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left bg-gradient-to-r from-khi-blue via-ted-red-bright to-gold"
      />

      {/* sticky top bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <div className="font-display text-base font-bold leading-none tracking-tight">
              TED<span className="text-khi-blue">x</span>Clifton
            </div>
            <div className="mt-1 truncate text-[10px] uppercase tracking-[0.28em] text-white/40">
              Sponsorship Proposal
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadPdf}
              disabled={busy}
              className="kx-btn-primary !px-4 !py-2 text-sm"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="hidden sm:inline">
                {busy ? "Preparing…" : "Download PDF"}
              </span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              onClick={lock}
              title="Lock proposal"
              aria-label="Lock proposal"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/30 hover:text-white"
            >
              <Lock size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* pages */}
      <main className="mx-auto max-w-[860px] px-3 py-8 md:px-6 md:py-14">
        <div className="space-y-6 md:space-y-10">
          {PROPOSAL_PAGES.map((p, i) => (
            <Slide
              key={p.src}
              src={p.src}
              alt={p.alt}
              index={i}
              reduced={reduced}
              onResolved={handleResolved}
            />
          ))}
        </div>

        {noneAvailable && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <div className="font-display text-2xl font-bold">
              Proposal coming together
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              The deck pages haven&apos;t been uploaded yet. Add the exported
              frames to
              <code className="mx-1 rounded bg-black/40 px-1.5 py-0.5 text-white/70">
                /public/proposal/
              </code>
              and they&apos;ll appear here.
            </p>
          </div>
        )}

        <footer className="mt-16 border-t border-white/10 pt-8 text-center">
          <div className="font-display text-lg font-bold">
            Next is <span className="kx-accent">Now</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-white/35">
            TEDxClifton · Clifton, Karachi
          </p>
        </footer>
      </main>
    </div>
  );
}
