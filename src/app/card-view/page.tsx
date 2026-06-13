import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { CardViewCard } from "./CardViewCard";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SITE_URL     = (process.env.NEXT_PUBLIC_SITE_URL || "https://tedxclifton.vercel.app").replace(/\/$/, "");

function cardImageUrl(cardId: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/card-images/${cardId}.jpg`;
}

// Deduplicated within a single render (called by both generateMetadata + page)
const getCardMeta = cache(async (cardId: string) => {
  try {
    const svc = createServiceClient();
    const { data } = await svc
      .from("card_shares")
      .select("name, template, designation")
      .eq("id", cardId)
      .single();
    return data as { name: string | null; template: string; designation: string | null } | null;
  } catch {
    return null;
  }
});

// ── OG metadata ────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { card?: string };
}): Promise<Metadata> {
  const cardId = searchParams.card;
  const meta   = cardId ? await getCardMeta(cardId) : null;

  const name   = meta?.name   ?? null;
  const isVip  = meta?.template === "vip";
  const ogImage = cardId ? cardImageUrl(cardId) : null;

  const title = name
    ? `${name} is attending TEDxClifton${isVip ? " as a VIP Delegate" : ""}`
    : "TEDxClifton — Attendance Card";

  const description = name
    ? `Join ${name} at Asia's First Multi Domain AI and Innovation Summit — June 7, 2026, PC Hotel Karachi.`
    : "Asia's First Multi Domain AI and Innovation Summit — June 7, 2026, PC Hotel Karachi.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/card-view${cardId ? `?card=${cardId}` : ""}`,
      ...(ogImage
        ? { images: [{ url: ogImage, width: 1080, height: 1080, alt: title }] }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

// ── Page ───────────────────────────────────────────────────────

export default async function CardViewPage({
  searchParams,
}: {
  searchParams: { card?: string };
}) {
  const cardId = searchParams.card;
  const meta   = cardId ? await getCardMeta(cardId) : null;

  const name        = meta?.name        ?? null;
  const designation = meta?.designation ?? null;
  const isVip       = meta?.template === "vip";
  const imgUrl      = cardId ? cardImageUrl(cardId) : null;

  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center px-6 py-14 md:py-20">

      {/* Top label */}
      <p className="kx-eyebrow mb-4">TEDxClifton</p>

      {/* Title */}
      <h1 className="font-display font-extrabold text-white text-3xl md:text-4xl -tracking-tight text-center mb-4">
        {name ? (
          <>
            {name}&rsquo;s{" "}
            <span className={isVip ? "text-[#FFB800]" : "kx-accent"}>
              {isVip ? "VIP Delegate" : "Attendance"} Card
            </span>
          </>
        ) : (
          <span className="kx-accent">Attendance Card</span>
        )}
      </h1>

      {designation && (
        <p className="text-sm mb-8" style={{ color: "#FFB800" }}>{designation}</p>
      )}
      {!designation && <div className="mb-8" />}

      {/* Animated card */}
      {imgUrl ? (
        <CardViewCard
          imgUrl={imgUrl}
          alt={name ? `${name}'s TEDxClifton attendance card` : "TEDxClifton attendance card"}
          isVip={isVip}
        />
      ) : (
        <div className="w-full max-w-[440px] mx-auto rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center h-64">
          <p className="text-white/35 text-sm">Card not found</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full max-w-[320px] mt-10">
        {imgUrl && (
          <a
            href={imgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="kx-btn kx-btn-outline w-full justify-center"
          >
            <Download size={15} />
            Save Card
          </a>
        )}
        <Link href="/card-generator" className="kx-btn kx-btn-primary w-full justify-center">
          Create Your Own Card
          <ArrowRight size={15} />
        </Link>
      </div>

      <p className="mt-10 text-xs text-white/25 text-center max-w-xs">
        Ideas Worth Spreading &middot; June 7, 2026 &middot; PC Hotel, Karachi
      </p>
    </main>
  );
}
