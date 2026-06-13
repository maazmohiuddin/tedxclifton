"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

type NavLink = { label: string; href: string };

const LINKS: NavLink[] = [
  { label: "Home",         href: "/" },
  { label: "About",        href: "/#about" },
  { label: "Experience",   href: "/#experience" },
  { label: "Partners",     href: "/#partners" },
  { label: "Speak",        href: "/submit" },
  { label: "Testimonials", href: "/testimonials" },
];

function Wordmark() {
  return (
    <span className="font-display font-extrabold tracking-tight leading-none text-xl md:text-[22px] inline-flex items-baseline">
      <span className="text-khi-blue">TED</span>
      <span className="text-khi-blue text-[0.62em] font-bold relative -top-[0.55em]">x</span>
      <span className="text-white ml-1">Clifton</span>
    </span>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-soft ${
        scrolled ? "backdrop-blur-xl bg-khi-ink/80" : "bg-transparent"
      }`}
      style={{ borderBottom: scrolled ? "1px solid var(--border-default)" : "1px solid transparent" }}
    >
      <nav
        aria-label="Primary"
        className="max-w-page mx-auto flex items-center justify-between px-6 md:px-14 py-4"
      >
        <Link
          href="/"
          aria-label="TEDxClifton home"
          className="group flex items-center gap-3 outline-none transition-transform duration-300 ease-soft hover:scale-[1.03]"
        >
          <Wordmark />
          <span className="sr-only">TEDxClifton</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-7">
          {LINKS.map(l => {
            const active = l.href === "/"
              ? pathname === "/"
              : l.href.startsWith("/#")
                ? false
                : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`group relative text-sm transition-colors duration-200 ease-soft hover:text-white ${
                    active ? "text-white" : "text-white/45"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                  {active ? (
                    <motion.span
                      layoutId="nav-underline"
                      aria-hidden="true"
                      className="absolute left-0 -bottom-1.5 h-[1px] w-full"
                      style={{ background: "linear-gradient(90deg, #FF1F44, transparent)" }}
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 -bottom-1.5 h-[1px] w-0 group-hover:w-1/2 transition-[width] duration-300 ease-soft"
                      style={{ background: "linear-gradient(90deg, #FF1F44, transparent)" }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/register" className="kx-btn-primary !py-2.5 !px-5 !text-[13px]">
              Get Tickets
            </Link>
          </li>
        </ul>

        {/* Mobile trigger */}
        <button
          type="button"
          className="md:hidden grid place-items-center w-10 h-10 rounded-full border border-white/10 text-white"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            id="mobile-nav"
            className="md:hidden fixed inset-x-0 top-[72px] bottom-0 bg-khi-ink/95 backdrop-blur-2xl z-40 overflow-y-auto"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <motion.ul
              className="flex flex-col gap-1 p-6"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } }}
              initial="hidden"
              animate="show"
            >
              {LINKS.map(l => (
                <MobileLink key={l.href} href={l.href} label={l.label} />
              ))}
              <motion.li variants={mobileItem} className="mt-4">
                <Link href="/register" className="kx-btn-primary w-full justify-center">
                  Get Tickets
                </Link>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

const mobileItem = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

function MobileLink({ href, label }: { href: string; label: string }) {
  return (
    <motion.li variants={mobileItem}>
      <Link
        href={href}
        className="block py-3 text-xl font-display font-bold text-white/80 hover:text-white transition-colors"
      >
        {label}
      </Link>
    </motion.li>
  );
}
