"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps the global chrome (preloader, nav, footer) so it can be hidden on
 * focused, shareable surfaces like the password-gated /proposal deck, which
 * render as their own full-screen experience.
 */
export function SiteChrome({
  preloader,
  nav,
  footer,
  children,
}: {
  preloader: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const bare = pathname.startsWith("/proposal");

  if (bare) return <>{children}</>;

  return (
    <>
      {preloader}
      {nav}
      {children}
      {footer}
    </>
  );
}
