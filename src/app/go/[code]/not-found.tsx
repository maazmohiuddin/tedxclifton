import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="kx-eyebrow mb-4">TEDxClifton</p>
      <h1 className="font-display font-extrabold text-white text-3xl md:text-4xl -tracking-tight mb-4">
        Card <span className="kx-accent">not found.</span>
      </h1>
      <p className="text-white/50 text-sm max-w-sm mb-8">
        This link may have expired or the card was removed. Generate your own card and share it with the world.
      </p>
      <Link href="/card-generator" className="kx-btn kx-btn-primary">
        Create Your Card
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
      <Link href="/" className="mt-4 text-xs text-white/35 hover:text-white/60 transition-colors">
        ← Back to home
      </Link>
    </main>
  );
}
