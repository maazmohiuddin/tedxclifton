import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { Preloader } from "@/components/layout/Preloader";
import { SiteChrome } from "@/components/layout/SiteChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TEDxClifton — Next is Now",
  description:
    "TEDxClifton — Ideas Worth Spreading. A day of bold talks, big ideas, and the people redefining what's next. Clifton, Karachi. x = an independently organized TED event.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "TEDxClifton — Next is Now",
    description: "Ideas Worth Spreading. Bold talks, big ideas — Clifton, Karachi.",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <SiteChrome
          preloader={<Preloader />}
          nav={<Nav />}
          footer={<Footer />}
        >
          <PageTransition>{children}</PageTransition>
        </SiteChrome>
      </body>
    </html>
  );
}
