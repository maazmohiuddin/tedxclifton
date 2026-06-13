import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign-in — TEDxClifton",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <>
      <PageHero eyebrow="Admin" title={<>Admin <span className="kx-accent">Panel</span></>}>
        Sign in to review registrations and approve TEDxClifton submissions.
      </PageHero>
      <section className="kx-section" aria-labelledby="login-title">
        <h2 id="login-title" className="sr-only">Sign in</h2>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </section>
    </>
  );
}
