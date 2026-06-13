import { NextResponse } from "next/server";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tedxclifton.vercel.app").replace(/\/$/, "");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("c");
  if (!slug) return NextResponse.json({ error: "Missing c param" }, { status: 400 });

  const cardUrl = `${SITE_URL}/go/${encodeURIComponent(slug)}`;
  const target  = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}`;

  return NextResponse.redirect(target, { status: 302 });
}
