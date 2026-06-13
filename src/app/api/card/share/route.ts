/**
 * POST /api/card/share
 * Uploads the JPEG card image and stores metadata (name, template,
 * designation) + a short 8-char slug in card_shares.
 * Returns { id, slug, url } — the slug powers the short share URL /go/{slug}.
 *
 * Rate limit: 3 cards per IP per 24 hours (persisted in card_shares.ip_address).
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { randomBytes, randomUUID } from "crypto";

export const runtime = "nodejs";

const RATE_LIMIT = 3;
const WINDOW_HOURS = 24;

function getClientIp(headersList: Headers): string {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request) {
  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 }); }

  const image = form.get("image");
  if (!(image instanceof Blob)) {
    return NextResponse.json({ error: "Missing 'image' field" }, { status: 400 });
  }

  if (image.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large (max 4 MB)" }, { status: 413 });
  }

  const name        = ((form.get("name")        as string | null) ?? "").trim();
  const template    = ((form.get("template")    as string | null) ?? "standard").trim();
  const designation = ((form.get("designation") as string | null) ?? "").trim();

  const svc = createServiceClient();

  // ── Rate limit check ─────────────────────────────────────────
  if (ip !== "unknown") {
    const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await svc
      .from("card_shares")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", windowStart);

    if (!countError && (count ?? 0) >= RATE_LIMIT) {
      return NextResponse.json(
        { error: `You can generate up to ${RATE_LIMIT} cards every ${WINDOW_HOURS} hours. Please try again later.` },
        { status: 429 }
      );
    }
  }

  // ── Upload image ─────────────────────────────────────────────
  const id   = randomUUID();
  const slug = randomBytes(4).toString("base64url");
  const key  = `${id}.jpg`;
  const buf  = Buffer.from(await image.arrayBuffer());

  const { error: uploadError } = await svc.storage
    .from("card-images")
    .upload(key, buf, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // ── Insert record ─────────────────────────────────────────────
  const { error: dbError } = await svc
    .from("card_shares")
    .insert({
      id,
      slug,
      name:        name        || null,
      template,
      designation: designation || null,
      ip_address:  ip,
    });

  if (dbError) {
    console.error("[card/share] card_shares insert:", dbError.message);
  }

  const { data: { publicUrl } } = svc.storage
    .from("card-images")
    .getPublicUrl(key);

  return NextResponse.json({ id, slug, url: publicUrl });
}
