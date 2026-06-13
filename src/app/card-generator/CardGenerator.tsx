"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, Share2, Check, ArrowLeft, Link2, Loader2, Lock } from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────

type Template = "standard" | "vip";

interface CardState {
  template: Template;
  name: string;
  designation: string;
  photoDataUrl: string | null;
  photoOffset: { x: number; y: number };
}

// ── Size catalogue ─────────────────────────────────────────────

const SIZES = {
  square:   { W: 1080, H: 1080, label: "Square",   sub: "1080 × 1080" },
  portrait: { W: 1080, H: 1350, label: "Portrait",  sub: "1080 × 1350" },
  story:    { W: 1080, H: 1920, label: "Story",     sub: "1080 × 1920" },
} as const;
type SizeKey = keyof typeof SIZES;

const VIP_PASSWORD = "KhinextVIP2026Cards";

// ── Image loaders with cache ───────────────────────────────────

let logoCache: HTMLImageElement | null = null;
let logoPromise: Promise<HTMLImageElement> | null = null;

function getLogoImg(): Promise<HTMLImageElement> {
  if (logoCache) return Promise.resolve(logoCache);
  if (logoPromise) return logoPromise;
  logoPromise = new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { logoCache = img; resolve(img); };
    img.onerror = reject;
    img.src = "/brand/logo.png";
  });
  return logoPromise;
}

let partnerCache: HTMLImageElement | null = null;
let partnerPromise: Promise<HTMLImageElement> | null = null;

function getPartnerImg(): Promise<HTMLImageElement> {
  if (partnerCache) return Promise.resolve(partnerCache);
  if (partnerPromise) return partnerPromise;
  partnerPromise = new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { partnerCache = img; resolve(img); };
    img.onerror = reject;
    img.src = "/brand/partner-logo.png";
  });
  return partnerPromise;
}

function loadDataUrlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCircleImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number, cy: number, radius: number,
  offsetFracX = 0, offsetFracY = 0
) {
  const nw = img.naturalWidth, nh = img.naturalHeight;
  const minDim = Math.min(nw, nh);
  const sxBase = (nw - minDim) / 2;
  const syBase = (nh - minDim) / 2;
  const sx = Math.max(0, Math.min(nw - minDim, sxBase * (1 - offsetFracX)));
  const sy = Math.max(0, Math.min(nh - minDim, syBase * (1 - offsetFracY)));
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, minDim, minDim, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawPhotoPlaceholder(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number, isVip: boolean
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = isVip ? "rgba(255,184,0,0.07)" : "rgba(49,107,255,0.08)";
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.26, radius * 0.30, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.44, radius * 0.50, radius * 0.40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxWidth: number,
  makeFont: (size: number) => string,
  startSize: number,
  minSize = 24
) {
  let size = startSize;
  ctx.font = makeFont(size);
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = makeFont(size);
  }
  ctx.fillText(text, x, y);
}

function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, cy: number,
  spacing: number
) {
  const total = text.length * spacing;
  let x = cx - total / 2;
  for (const ch of text) {
    ctx.fillText(ch, x + spacing / 2, cy);
    x += spacing;
  }
}

// Draw name with the last word styled like kx-accent:
// italic, blue (#4579FF), with a canvas shadow glow.
function drawAccentName(
  ctx: CanvasRenderingContext2D,
  name: string,
  cx: number, cy: number,
  maxWidth: number,
  startSize: number,
  minSize = 26
) {
  const words = name.trim().split(/\s+/);
  const makeRegular  = (sz: number) => `800 ${sz}px "Helvetica Now Display","Helvetica",sans-serif`;
  const makeAccent   = (sz: number) => `italic 800 ${sz}px "Helvetica Now Display","Helvetica",sans-serif`;

  if (words.length === 1) {
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fitText(ctx, words[0], cx, cy, maxWidth, makeRegular, startSize, minSize);
    return;
  }

  const lastName  = words[words.length - 1];
  const firstPart = words.slice(0, -1).join(" ");

  let size = startSize;
  while (size > minSize) {
    ctx.font = makeRegular(size);
    const fw = ctx.measureText(firstPart + " ").width;
    ctx.font = makeAccent(size);
    const lw = ctx.measureText(lastName).width;
    if (fw + lw <= maxWidth) break;
    size -= 2;
  }

  ctx.font = makeRegular(size);
  const firstWidth = ctx.measureText(firstPart + " ").width;
  ctx.font = makeAccent(size);
  const lastWidth = ctx.measureText(lastName).width;

  const startX = cx - (firstWidth + lastWidth) / 2;

  ctx.font = makeRegular(size);
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(firstPart + " ", startX, cy);

  ctx.font = makeAccent(size);
  ctx.save();
  ctx.shadowColor = "rgba(69,121,255,0.85)";
  ctx.shadowBlur  = 22;
  ctx.fillStyle   = "#4579FF";
  ctx.fillText(lastName, startX + firstWidth, cy);
  ctx.shadowBlur  = 8;
  ctx.fillStyle   = "rgba(180,210,255,0.92)";
  ctx.fillText(lastName, startX + firstWidth, cy);
  ctx.restore();

  ctx.textAlign = "center";
}

async function drawPartnerLogo(
  ctx: CanvasRenderingContext2D,
  cx: number, labelY: number, logoY: number, radius: number,
  isVip: boolean,
  gen: number, genRef: React.MutableRefObject<number>
) {
  try {
    const partner = await getPartnerImg();
    if (gen !== genRef.current) return;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isVip ? "rgba(255,200,80,0.45)" : "rgba(255,255,255,0.30)";
    ctx.font = `700 ${Math.round(radius * 0.36)}px "Helvetica", sans-serif`;
    ctx.fillText("PARTNERED BY", cx, labelY);

    // PNG has transparency — draw directly, no white disc
    drawCircleImage(ctx, partner, cx, logoY, radius);
  } catch {
    // Logo file absent — skip silently
  }
}

// ── Standard card ──────────────────────────────────────────────
// Layout (reference 1080 × 1080):
//   52   logo
//  138   accent line
//  174   "I AM ATTENDING"
//  270   "KHINEXT"                  ← baseline ~270, bottom ~316
//                                   ← ~74 px breathing room
//  390   photo top  (centre 540, r 150)
//  540   photo centre
//  690   photo bottom
//  730   name
//  762   divider
//  796   tagline
//  834   footer
//  874   "PARTNERED BY"
//  922   partner logo centre (r 32) → bottom 954
// 1077   bottom bar

async function drawStandard(
  ctx: CanvasRenderingContext2D,
  s: CardState,
  W: number, H: number,
  gen: number, genRef: React.MutableRefObject<number>
) {
  const ys = H / 1080;
  const r = (n: number) => Math.round(n * ys);

  ctx.fillStyle = "#040B1C";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = "rgba(49,107,255,0.065)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 56) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += 56) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  const suppress = ctx.createRadialGradient(W / 2, H * 0.5, r(110), W / 2, H * 0.5, r(540));
  suppress.addColorStop(0,   "rgba(4,11,28,0.93)");
  suppress.addColorStop(0.6, "rgba(4,11,28,0.60)");
  suppress.addColorStop(1,   "rgba(4,11,28,0)");
  ctx.fillStyle = suppress;
  ctx.fillRect(0, 0, W, H);

  const tg = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, r(420));
  tg.addColorStop(0,   "rgba(49,107,255,0.26)");
  tg.addColorStop(0.6, "rgba(49,107,255,0.07)");
  tg.addColorStop(1,   "rgba(49,107,255,0)");
  ctx.fillStyle = tg;
  ctx.fillRect(0, 0, W, r(420));

  try {
    const logo = await getLogoImg();
    if (gen !== genRef.current) return;
    const lw = 200, lh = (logo.naturalHeight / logo.naturalWidth) * lw;
    ctx.drawImage(logo, (W - lw) / 2, r(52), lw, lh);
  } catch { /* unavailable */ }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.font = `700 ${r(22)}px "Helvetica Now Display", "Helvetica", sans-serif`;
  drawSpaced(ctx, "I AM ATTENDING AS A", W / 2, r(160), r(19.5));

  // DELEGATE — blue gradient matching the standard theme
  const blueGrad = ctx.createLinearGradient(r(120), 0, W - r(120), 0);
  blueGrad.addColorStop(0,    "#1A3B8F");
  blueGrad.addColorStop(0.25, "#4579FF");
  blueGrad.addColorStop(0.5,  "#FFFFFF");
  blueGrad.addColorStop(0.75, "#4579FF");
  blueGrad.addColorStop(1,    "#1A3B8F");
  ctx.fillStyle = blueGrad;
  fitText(ctx, "DELEGATE", W / 2, r(230), W - r(80),
    sz => `900 ${sz}px "Helvetica Now Display", "Helvetica", sans-serif`, r(90), 40);

  // ── Photo — centre at 480, radius 150 (67px balanced gap above & below) ──
  const px = W / 2, py = r(480), pr = r(150);

  // Halo disc (not full-canvas rect)
  const haloGrad = ctx.createRadialGradient(px, py, pr, px, py, pr + r(60));
  haloGrad.addColorStop(0,   "rgba(49,107,255,0.14)");
  haloGrad.addColorStop(0.7, "rgba(49,107,255,0.04)");
  haloGrad.addColorStop(1,   "transparent");
  ctx.beginPath();
  ctx.arc(px, py, pr + r(60), 0, Math.PI * 2);
  ctx.fillStyle = haloGrad;
  ctx.fill();

  if (s.photoDataUrl) {
    try {
      const imgEl = await loadDataUrlImage(s.photoDataUrl);
      if (gen !== genRef.current) return;
      drawCircleImage(ctx, imgEl, px, py, pr, s.photoOffset.x, s.photoOffset.y);
    } catch { drawPhotoPlaceholder(ctx, px, py, pr, false); }
  } else {
    drawPhotoPlaceholder(ctx, px, py, pr, false);
  }

  ctx.beginPath();
  ctx.arc(px, py, pr + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(49,107,255,0.80)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(px, py, pr + r(14), 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(49,107,255,0.15)";
  ctx.lineWidth = 7;
  ctx.stroke();

  // Name — last word gets kx-accent style (blue italic glow)
  const nameText = s.name.trim() || "Your Name";
  drawAccentName(ctx, nameText, W / 2, r(725), 860, r(56), 26);

  const hasDesig = s.designation.trim().length > 0;
  if (hasDesig) {
    ctx.fillStyle = "rgba(143,175,255,0.88)";
    fitText(ctx, s.designation.trim(), W / 2, r(778), 820,
      (sz) => `400 ${sz}px "Helvetica Now Display", "Helvetica", sans-serif`, r(27), 18);
  }

  const divY = hasDesig ? r(812) : r(768);

  const dg = ctx.createLinearGradient(W / 2 - 70, 0, W / 2 + 70, 0);
  dg.addColorStop(0, "transparent");
  dg.addColorStop(0.5, "rgba(49,107,255,0.60)");
  dg.addColorStop(1, "transparent");
  ctx.fillStyle = dg;
  ctx.fillRect(W / 2 - 70, divY, 140, 1.5);

  const tY = divY + r(36);

  ctx.font = `400 ${r(20)}px "Helvetica", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.44)";
  ctx.textAlign = "center";
  ctx.fillText("Asia's First Multi Domain AI and Innovation Summit", W / 2, tY);

  ctx.font = `700 ${r(18)}px "Helvetica", sans-serif`;
  ctx.fillStyle = "rgba(143,175,255,0.80)";
  ctx.fillText("PC Hotel, Karachi  ·  June 7, 2026  ·  tedxclifton.com", W / 2, tY + r(38));

  await drawPartnerLogo(ctx, W / 2, tY + r(78), tY + r(128), r(42), false, gen, genRef);
  if (gen !== genRef.current) return;

  // Bottom bar
  const bl = ctx.createLinearGradient(0, 0, W, 0);
  bl.addColorStop(0, "transparent");
  bl.addColorStop(0.5, "rgba(49,107,255,0.75)");
  bl.addColorStop(1, "transparent");
  ctx.fillStyle = bl;
  ctx.fillRect(0, H - 3, W, 3);
}

// ── VIP card ───────────────────────────────────────────────────

async function drawVip(
  ctx: CanvasRenderingContext2D,
  s: CardState,
  W: number, H: number,
  gen: number, genRef: React.MutableRefObject<number>
) {
  const ys = H / 1080;
  const r = (n: number) => Math.round(n * ys);

  ctx.fillStyle = "#020409";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,184,0,0.045)";
  for (let x = 18; x < W; x += 36) {
    for (let y = 18; y < H; y += 36) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const suppress = ctx.createRadialGradient(W / 2, H * 0.48, r(100), W / 2, H * 0.48, r(520));
  suppress.addColorStop(0,   "rgba(2,4,9,0.94)");
  suppress.addColorStop(0.6, "rgba(2,4,9,0.62)");
  suppress.addColorStop(1,   "rgba(2,4,9,0)");
  ctx.fillStyle = suppress;
  ctx.fillRect(0, 0, W, H);

  const tg = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, r(480));
  tg.addColorStop(0,   "rgba(255,184,0,0.20)");
  tg.addColorStop(0.6, "rgba(255,184,0,0.05)");
  tg.addColorStop(1,   "rgba(255,184,0,0)");
  ctx.fillStyle = tg;
  ctx.fillRect(0, 0, W, r(480));

  const cg = ctx.createRadialGradient(W, H, 0, W, H, r(420));
  cg.addColorStop(0, "rgba(255,184,0,0.06)");
  cg.addColorStop(1, "rgba(255,184,0,0)");
  ctx.fillStyle = cg;
  ctx.fillRect(W - r(420), H - r(420), r(420), r(420));

  try {
    const logo = await getLogoImg();
    if (gen !== genRef.current) return;
    const lw = 192, lh = (logo.naturalHeight / logo.naturalWidth) * lw;
    ctx.drawImage(logo, (W - lw) / 2, r(46), lw, lh);
  } catch { /* continue */ }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.36)";
  ctx.font = `700 ${r(22)}px "Helvetica Now Display", "Helvetica", sans-serif`;
  drawSpaced(ctx, "I AM ATTENDING AS A", W / 2, r(146), r(19.5));

  // VIP DELEGATE — fitText prevents overflow
  const goldGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  goldGrad.addColorStop(0,    "#7A5010");
  goldGrad.addColorStop(0.25, "#FFD060");
  goldGrad.addColorStop(0.5,  "#FFF0A0");
  goldGrad.addColorStop(0.75, "#FFD060");
  goldGrad.addColorStop(1,    "#7A5010");
  ctx.fillStyle = goldGrad;
  fitText(ctx, "VIP DELEGATE", W / 2, r(254), W - r(80),
    sz => `900 ${sz}px "Helvetica Now Display", "Helvetica", sans-serif`, r(90), 40);

  // Gold line
  const ul = ctx.createLinearGradient(0, 0, W, 0);
  ul.addColorStop(0,    "transparent");
  ul.addColorStop(0.2,  "rgba(255,184,0,0.40)");
  ul.addColorStop(0.5,  "rgba(255,240,160,0.60)");
  ul.addColorStop(0.8,  "rgba(255,184,0,0.40)");
  ul.addColorStop(1,    "transparent");
  ctx.fillStyle = ul;
  ctx.fillRect(0, r(314), W, 1.5);

  // Photo — centre 488, r 145 (top 343, 29 px below gold line)
  const px = W / 2, py = r(488), pr = r(145);

  const haloGrad = ctx.createRadialGradient(px, py, pr, px, py, pr + r(60));
  haloGrad.addColorStop(0,   "rgba(255,184,0,0.14)");
  haloGrad.addColorStop(0.7, "rgba(255,184,0,0.04)");
  haloGrad.addColorStop(1,   "transparent");
  ctx.beginPath();
  ctx.arc(px, py, pr + r(60), 0, Math.PI * 2);
  ctx.fillStyle = haloGrad;
  ctx.fill();

  if (s.photoDataUrl) {
    try {
      const imgEl = await loadDataUrlImage(s.photoDataUrl);
      if (gen !== genRef.current) return;
      drawCircleImage(ctx, imgEl, px, py, pr, s.photoOffset.x, s.photoOffset.y);
    } catch { drawPhotoPlaceholder(ctx, px, py, pr, true); }
  } else {
    drawPhotoPlaceholder(ctx, px, py, pr, true);
  }

  const ringGrad = ctx.createLinearGradient(px - pr, py - pr, px + pr, py + pr);
  ringGrad.addColorStop(0,    "#7A5010");
  ringGrad.addColorStop(0.25, "#FFD060");
  ringGrad.addColorStop(0.5,  "#FFF0A0");
  ringGrad.addColorStop(0.75, "#FFD060");
  ringGrad.addColorStop(1,    "#7A5010");
  ctx.beginPath();
  ctx.arc(px, py, pr + 3, 0, Math.PI * 2);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(px, py, pr + r(15), 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,184,0,0.11)";
  ctx.lineWidth = 7;
  ctx.stroke();

  // Name — last word gets kx-accent style (blue italic glow)
  const nameText = s.name.trim() || "Your Name";
  drawAccentName(ctx, nameText, W / 2, r(710), 860, r(56), 26);

  const hasDesig = s.designation.trim().length > 0;
  if (hasDesig) {
    ctx.fillStyle = "rgba(255,200,55,0.88)";
    fitText(ctx, s.designation.trim(), W / 2, r(756), 820,
      (sz) => `400 ${sz}px "Helvetica Now Display", "Helvetica", sans-serif`, r(28), 18);
  }

  const divY = hasDesig ? r(796) : r(748);

  const dg = ctx.createLinearGradient(W / 2 - 70, 0, W / 2 + 70, 0);
  dg.addColorStop(0, "transparent");
  dg.addColorStop(0.5, "rgba(255,184,0,0.58)");
  dg.addColorStop(1, "transparent");
  ctx.fillStyle = dg;
  ctx.fillRect(W / 2 - 70, divY, 140, 1.5);

  const tY = divY + r(44);

  ctx.font = `400 ${r(20)}px "Helvetica", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillText("Asia's First Multi Domain AI and Innovation Summit", W / 2, tY);

  ctx.font = `700 ${r(18)}px "Helvetica", sans-serif`;
  ctx.fillStyle = "rgba(255,184,0,0.70)";
  ctx.fillText("PC Hotel, Karachi  ·  June 7, 2026  ·  tedxclifton.com", W / 2, tY + r(38));

  await drawPartnerLogo(ctx, W / 2, tY + r(68), tY + r(118), r(38), true, gen, genRef);
  if (gen !== genRef.current) return;

  // Bottom bar
  const bl = ctx.createLinearGradient(0, 0, W, 0);
  bl.addColorStop(0, "transparent");
  bl.addColorStop(0.5, "rgba(255,184,0,0.72)");
  bl.addColorStop(1, "transparent");
  ctx.fillStyle = bl;
  ctx.fillRect(0, H - 3, W, 3);
}

// ── Upload card image to Supabase ──────────────────────────────

async function uploadCard(
  canvas: HTMLCanvasElement,
  meta: { name: string; template: string; designation: string },
): Promise<{ id: string; slug: string } | { error: string } | null> {
  try {
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => b ? res(b) : rej(new Error("toBlob")), "image/jpeg", 0.93)
    );
    const form = new FormData();
    form.append("image",       blob,            "card.jpg");
    form.append("name",        meta.name);
    form.append("template",    meta.template);
    form.append("designation", meta.designation);
    const resp = await fetch("/api/card/share", { method: "POST", body: form });
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      return { error: body.error ?? "Upload failed" };
    }
    const { id, slug } = await resp.json();
    return { id, slug } as { id: string; slug: string };
  } catch {
    return null;
  }
}

// ── Shareable URL ──────────────────────────────────────────────

function makeShareUrl(slug: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://tedxclifton.vercel.app";
  return `${base}/go/${slug}`;
}

// ── VIP Password Modal ─────────────────────────────────────────

function VipModal({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);

  function submit() {
    if (pwd === VIP_PASSWORD) { onSuccess(); }
    else { setErr(true); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 p-8"
        style={{ background: "linear-gradient(135deg,#0A0D1A,#060810)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#5C3D00,#B8860B)" }}>
            <Lock size={16} className="text-yellow-200" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-lg leading-tight">VIP Access</h2>
            <p className="text-xs text-white/40">Restricted to VIP delegates only</p>
          </div>
        </div>
        <p className="text-sm text-white/55 mb-5">
          Enter the VIP access code to unlock VIP Delegate card generation.
        </p>
        <input
          type="password"
          value={pwd}
          autoFocus
          placeholder="Access code"
          maxLength={64}
          className={`kx-input w-full rounded-xl mb-1 ${err ? "!border-red-500/50" : ""}`}
          onChange={e => { setPwd(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        {err && <p className="text-xs text-red-400 mb-3">Incorrect access code — please try again.</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="kx-btn kx-btn-outline flex-1 justify-center">
            Cancel
          </button>
          <button onClick={submit}
            className="kx-btn kx-btn-primary flex-1 justify-center"
            style={{ background: "linear-gradient(135deg,#5C3D00,#B8860B,#5C3D00)" }}>
            Unlock VIP
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export function CardGenerator() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawGenRef   = useRef(0);
const isDragging   = useRef(false);

  const [state, setState] = useState<CardState>({
    template: "standard",
    name: "",
    designation: "",
    photoDataUrl: null,
    photoOffset: { x: 0, y: 0 },
  });

  const [sizeKey,      setSizeKey]      = useState<SizeKey>("square");
  const [vipUnlocked,  setVipUnlocked]  = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [tokenState,   setTokenState]   = useState<"idle" | "validating" | "expired" | "invalid">("idle");
  const [downloading,  setDownloading]  = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [shared,       setShared]       = useState(false);
  const [linkCopied,   setLinkCopied]   = useState(false);
  const [fmt,          setFmt]          = useState<"jpeg" | "png">("jpeg");
  const [shareError,   setShareError]   = useState<string | null>(null);
  const [lastUpload,   setLastUpload]   = useState<{
    slug: string;
    name: string;
    designation: string;
    template: string;
    photoDataUrl: string | null;
  } | null>(null);

  const { W: CW, H: CH } = SIZES[sizeKey];
  const isVip = state.template === "vip";

  const stateRef = useRef(state);
  const sizeRef  = useRef({ CW, CH });
  stateRef.current = state;
  sizeRef.current  = { CW, CH };

  // All required fields must be filled + photo uploaded before download/share
  const isCardReady =
    !!state.photoDataUrl &&
    !!state.name.trim() &&
    (!isVip || !!state.designation.trim());

  const readinessHint = !state.photoDataUrl
    ? "Upload a photo first"
    : !state.name.trim()
    ? "Enter your name"
    : isVip && !state.designation.trim()
    ? "Enter your designation"
    : null;

  // Pre-fill from URL params on first mount; validate VIP token if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const t = p.get("t") as Template | null;
    const token = p.get("token");
    const n = p.get("n") ?? "";
    const d = p.get("d") ?? "";

    if (t || n || d) {
      setState(prev => ({
        ...prev,
        template:    (t === "vip" || t === "standard") ? t : prev.template,
        name:        n || prev.name,
        designation: d || prev.designation,
      }));
    }

    if (t === "vip") {
      if (token) {
        // Validate the per-recipient invite token
        setTokenState("validating");
        fetch(`/api/vip/validate?token=${encodeURIComponent(token)}`)
          .then(r => r.json())
          .then((data: { valid: boolean; reason?: string }) => {
            if (data.valid) {
              setVipUnlocked(true);
              setTokenState("idle");
            } else {
              setTokenState(data.reason === "expired" ? "expired" : "invalid");
            }
          })
          .catch(() => setTokenState("invalid"));
      } else {
        // Staff/direct VIP link without token — still grant access
        setVipUnlocked(true);
      }
    }
  }, []);

  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;
    const { CW: w, CH: h } = sizeRef.current;
    const genId = ++drawGenRef.current;
    if (typeof document !== "undefined") await document.fonts.ready;
    if (genId !== drawGenRef.current) return;
    ctx.clearRect(0, 0, w, h);
    if (s.template === "standard") {
      await drawStandard(ctx, s, w, h, genId, drawGenRef);
    } else {
      await drawVip(ctx, s, w, h, genId, drawGenRef);
    }
  }, []); // stable — reads state from refs

  // Immediate redraw for layout/visual changes
  useEffect(() => { redraw(); }, [redraw, state.template, state.photoDataUrl, state.photoOffset.x, state.photoOffset.y, CW, CH]);

  // Debounced redraw for text input
  useEffect(() => {
    const id = window.setTimeout(redraw, 180);
    return () => window.clearTimeout(id);
  }, [redraw, state.name, state.designation]);

  // ── Handlers ────────────────────────────────────────────────

  function handleVipTabClick() {
    if (vipUnlocked) {
      setState(s => ({ ...s, template: "vip" }));
    } else {
      setShowVipModal(true);
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setState(s => ({ ...s, photoDataUrl: ev.target?.result as string, photoOffset: { x: 0, y: 0 } }));
    reader.onerror = () => {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShareError("Photo failed to load — please try a different file.");
      setTimeout(() => setShareError(null), 5000);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setState(s => ({ ...s, photoDataUrl: null, photoOffset: { x: 0, y: 0 } }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePhotoPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
  }

  function handlePhotoPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    const sensitivity = 120; // lower = more sensitive
    setState(s => ({
      ...s,
      photoOffset: {
        x: Math.max(-1, Math.min(1, s.photoOffset.x + e.movementX / sensitivity)),
        y: Math.max(-1, Math.min(1, s.photoOffset.y + e.movementY / sensitivity)),
      },
    }));
  }

  function handlePhotoPointerUp() {
    isDragging.current = false;
  }

  function resetPhotoOffset() {
    setState(s => ({ ...s, photoOffset: { x: 0, y: 0 } }));
  }

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    await redraw();
    const mime = fmt === "jpeg" ? "image/jpeg" : "image/png";
    const url  = canvas.toDataURL(mime, fmt === "jpeg" ? 0.96 : undefined);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `khinext-${state.template}-card-${sizeKey}.${fmt}`;
    a.click();
    setDownloading(false);
    // Record to card_shares in background — skip if inputs haven't changed since last upload
    const snap = state;
    if (
      !lastUpload ||
      lastUpload.name !== snap.name ||
      lastUpload.designation !== snap.designation ||
      lastUpload.template !== snap.template ||
      lastUpload.photoDataUrl !== snap.photoDataUrl
    ) {
      uploadCard(canvas, snap).then(result => {
        if (result && !("error" in result)) {
          setLastUpload({ slug: result.slug, name: snap.name, designation: snap.designation, template: snap.template, photoDataUrl: snap.photoDataUrl });
        }
      }).catch(() => {});
    }
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await redraw();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        const blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(b => b ? res(b) : rej(new Error("toBlob")), "image/jpeg", 0.96)
        );
        const file = new File([blob], "khinext-card.jpg", { type: "image/jpeg" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((navigator as any).canShare?.({ files: [file] })) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (navigator as any).share({ files: [file],
            title: "I'm attending TEDxClifton — Ideas Worth Spreading" });
          setShared(true);
          setTimeout(() => setShared(false), 2500);
          return;
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    setShareError("Device sharing unavailable — downloading instead.");
    setTimeout(() => setShareError(null), 3000);
    await handleDownload();
  }

  function showShareError(msg: string) {
    setShareError(msg);
    setTimeout(() => setShareError(null), 5000);
  }

  // Returns cached slug if name/designation/template/photo are unchanged,
  // otherwise uploads a new card and updates the cache.
  async function getOrUploadCard(canvas: HTMLCanvasElement): Promise<{ slug: string } | { error: string } | null> {
    if (
      lastUpload &&
      lastUpload.name === state.name &&
      lastUpload.designation === state.designation &&
      lastUpload.template === state.template &&
      lastUpload.photoDataUrl === state.photoDataUrl
    ) {
      return { slug: lastUpload.slug };
    }
    setUploading(true);
    await redraw();
    const result = await uploadCard(canvas, state);
    setUploading(false);
    if (result && !("error" in result)) {
      setLastUpload({
        slug: result.slug,
        name: state.name,
        designation: state.designation,
        template: state.template,
        photoDataUrl: state.photoDataUrl,
      });
    }
    return result;
  }

  async function handleCopyLink() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const card = await getOrUploadCard(canvas);
    if (!card) return;
    if ("error" in card) { showShareError(card.error); return; }
    const url = makeShareUrl(card.slug);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  // Open popup synchronously (user gesture), then navigate after async upload
  async function handleShareLinkedIn() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const win = window.open("about:blank", "_blank", "width=600,height=480");
    const card = await getOrUploadCard(canvas);
    if (!card) { win?.close(); return; }
    if ("error" in card) { win?.close(); showShareError(card.error); return; }
    // Must use absolute URL — relative URLs don't resolve from about:blank
    const origin = window.location.origin;
    const shareUrl = `${origin}/go/${encodeURIComponent(card.slug)}`;
    if (win) win.location.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  }

  async function handleShareFacebook() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const win = window.open("about:blank", "_blank", "width=600,height=480");
    const card = await getOrUploadCard(canvas);
    if (!card) { win?.close(); return; }
    if ("error" in card) { win?.close(); showShareError(card.error); return; }
    const origin = window.location.origin;
    const shareUrl = `${origin}/go/${encodeURIComponent(card.slug)}`;
    if (win) win.location.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  }

  const accent     = isVip ? "#FFB800"              : "#316BFF";
  const accentMute = isVip ? "rgba(255,184,0,0.18)" : "rgba(49,107,255,0.18)";

  return (
    <>
      {showVipModal && (
        <VipModal
          onSuccess={() => {
            setVipUnlocked(true);
            setShowVipModal(false);
            setState(s => ({ ...s, template: "vip" }));
          }}
          onClose={() => setShowVipModal(false)}
        />
      )}

      <div className="max-w-page mx-auto px-6 md:px-14 py-12 md:py-16">

        {/* Header */}
        <header className="mb-10">
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-4">
            <ArrowLeft size={12} /> Back to Home
          </Link>
          <p className="kx-eyebrow mb-3">TEDxClifton</p>
          <h1 className="font-display font-extrabold text-white text-4xl md:text-5xl -tracking-tight mb-3">
            Your <span className="kx-accent">Digital Card</span>
          </h1>
          <p className="text-white/50 text-sm max-w-lg">
            Personalise your attendance card and share it on LinkedIn, Instagram, and Facebook.
          </p>
        </header>

        {/* Template selector */}
        <div role="tablist"
          className="inline-flex gap-1 rounded-full bg-white/[0.04] border border-white/10 p-1 mb-6">
          <button
            role="tab" aria-selected={!isVip}
            onClick={() => setState(s => ({ ...s, template: "standard" }))}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              !isVip ? "bg-khi-blue text-white shadow-lg" : "text-white/50 hover:text-white"
            }`}>
            Standard
          </button>
          <button
            role="tab" aria-selected={isVip}
            onClick={handleVipTabClick}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              isVip ? "text-white shadow-lg" : "text-white/50 hover:text-white"
            }`}
            style={isVip ? { background: "linear-gradient(135deg,#5C3D00,#B8860B,#5C3D00)" } : {}}>
            {tokenState === "validating" ? <Loader2 size={11} className="animate-spin opacity-60" /> : (!vipUnlocked && <Lock size={11} className="opacity-60" />)}
            {vipUnlocked ? "✦" : ""} VIP Delegate
          </button>
        </div>

        {/* Token error banners */}
        {tokenState === "expired" && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Your VIP access link has expired (tokens are valid for 48 hours). Please contact the TEDxClifton team for a new invite.
          </div>
        )}
        {tokenState === "invalid" && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            This VIP access link is invalid. Please check your invitation email or contact the TEDxClifton team.
          </div>
        )}

        {/* Size selector */}
        <div className="flex flex-wrap gap-2 mb-10">
          {(Object.entries(SIZES) as [SizeKey, typeof SIZES[SizeKey]][]).map(([key, sz]) => (
            <button key={key} onClick={() => setSizeKey(key)}
              className={`flex flex-col items-center px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                sizeKey === key
                  ? "border-khi-blue bg-khi-blue/10 text-white"
                  : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/70"
              }`}>
              <span>{sz.label}</span>
              <span className={`text-[10px] font-normal mt-0.5 ${sizeKey === key ? "text-white/60" : "text-white/25"}`}>
                {sz.sub}
              </span>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">

          {/* ── Controls panel ── */}
          <div className="space-y-4">

            {/* Photo upload */}
            <div className="kx-card !p-6 !rounded-2xl">
              <p className="kx-label block mb-3">Your Photo</p>
              {state.photoDataUrl ? (
                <div className="flex flex-col items-center gap-3">
                  {/* Draggable circle preview */}
                  <div
                    onPointerDown={handlePhotoPointerDown}
                    onPointerMove={handlePhotoPointerMove}
                    onPointerUp={handlePhotoPointerUp}
                    onPointerLeave={handlePhotoPointerUp}
                    className="rounded-full overflow-hidden flex-shrink-0 border-2 select-none touch-none"
                    style={{
                      width: 140,
                      height: 140,
                      borderColor: accent,
                      cursor: "grab",
                      boxShadow: `0 0 0 4px ${accentMute}`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={state.photoDataUrl}
                      alt="Preview"
                      draggable={false}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${50 - state.photoOffset.x * 50}% ${50 - state.photoOffset.y * 50}%`,
                        pointerEvents: "none",
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-white/35 text-center leading-tight">
                    Drag to reposition
                  </p>

                  {/* Actions row */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetPhotoOffset}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white/45 hover:text-white border border-white/10 hover:border-white/25"
                    >
                      Center
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white/45 hover:text-white border border-white/10 hover:border-white/25"
                    >
                      Replace
                    </button>
                    <button
                      onClick={removePhoto}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-red-400/60 hover:text-red-400 border border-red-500/15 hover:border-red-500/35"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-3 py-8 rounded-xl border-2 border-dashed border-white/12 hover:border-white/28 transition-colors group">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: accentMute }}>
                    <Upload size={20} style={{ color: accent }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/65 group-hover:text-white transition-colors">
                      Upload Photo
                    </p>
                    <p className="text-xs text-white/30 mt-1">JPG or PNG · Best with a headshot</p>
                  </div>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*"
                className="sr-only" onChange={handlePhotoUpload} />
            </div>

            {/* Name */}
            <div className="kx-card !p-6 !rounded-2xl">
              <label htmlFor="card-name" className="kx-label block mb-2">Your Name</label>
              <input id="card-name" type="text" value={state.name}
                onChange={e => setState(s => ({ ...s, name: e.target.value }))}
                placeholder="Dr. Ayesha Khan" maxLength={50}
                className="kx-input w-full rounded-xl" />
            </div>

            {/* Designation — shown for all templates */}
            <div className="kx-card !p-6 !rounded-2xl"
              style={{ borderColor: isVip ? "rgba(255,184,0,0.18)" : "rgba(49,107,255,0.18)" }}>
              <label htmlFor="card-designation"
                className="block mb-2 text-[11px] font-bold uppercase"
                style={{ color: isVip ? "#FFB800" : "#8FAFFF", letterSpacing: "0.14em" }}>
                Designation / Title{!isVip && <span className="ml-1.5 font-normal normal-case opacity-50">(optional)</span>}
              </label>
              <input id="card-designation" type="text" value={state.designation}
                onChange={e => setState(s => ({ ...s, designation: e.target.value }))}
                placeholder={isVip ? "CEO · AI Research Director" : "Founder · Speaker · Engineer"}
                maxLength={55}
                className="kx-input w-full rounded-xl"
                style={{ borderColor: isVip ? "rgba(255,184,0,0.20)" : "rgba(49,107,255,0.20)" }} />
              <p className="text-xs text-white/32 mt-2">
                {isVip ? "Appears in gold below your name" : "Appears in blue below your name"}
              </p>
            </div>

            {/* Card summary */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 text-xs text-white/38 space-y-1.5">
              <p className="text-white/55 font-semibold mb-2.5">
                {isVip ? "VIP Delegate" : "Standard"} card includes:
              </p>
              {isVip ? (
                <>
                  <p>✦ &ldquo;I am attending as a VIP Delegate&rdquo;</p>
                  <p>✦ Your photo · Gold ring frame</p>
                  <p>✦ Your name + designation</p>
                </>
              ) : (
                <>
                  <p>✦ &ldquo;I am attending as a Delegate&rdquo;</p>
                  <p>✦ Your photo · Blue ring frame</p>
                  <p>✦ Your name + optional designation</p>
                </>
              )}
              <p>✦ Ideas Worth Spreading</p>
              <p>✦ PC Hotel, Karachi · June 7, 2026 · tedxclifton.com</p>
              <p>✦ Partnered by Sports &amp; Youth Affairs Dept</p>
            </div>

            {/* Format toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">Format:</span>
              <div className="inline-flex gap-0.5 rounded-full bg-white/[0.05] border border-white/10 p-0.5">
                {(["jpeg", "png"] as const).map(f => (
                  <button key={f} onClick={() => setFmt(f)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                      fmt === f ? "bg-white/15 text-white" : "text-white/40 hover:text-white"
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Readiness hint — shown when card isn't ready */}
            {readinessHint && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5">
                <span className="text-amber-400 text-base leading-none">↑</span>
                <p className="text-[12px] text-amber-300/80">
                  {readinessHint} to unlock download &amp; sharing
                </p>
              </div>
            )}

            {/* Share / rate-limit error */}
            {shareError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-2.5">
                <span className="text-red-400 text-base leading-none mt-0.5">⚠</span>
                <p className="text-[12px] text-red-300/90">{shareError}</p>
              </div>
            )}

            {/* Download */}
            <button onClick={handleDownload} disabled={downloading || !isCardReady}
              className={`kx-btn kx-btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed ${isCardReady ? "animate-btn-glow" : ""}`}>
              <Download size={16} />
              {downloading ? "Generating…" : `Download ${fmt.toUpperCase()}`}
            </button>

            {/* Share via device */}
            <button onClick={handleShare} disabled={!isCardReady}
              className="kx-btn kx-btn-outline w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed">
              {shared ? <Check size={16} /> : <Share2 size={16} />}
              {shared ? "Shared!" : "Share via device"}
            </button>

            {/* Copy unique link */}
            <button onClick={handleCopyLink} disabled={uploading || !isCardReady}
              className={`kx-btn w-full justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                linkCopied
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  : "kx-btn-outline"
              }`}>
              {uploading ? <Loader2 size={16} className="animate-spin" /> : linkCopied ? <Check size={16} /> : <Link2 size={16} />}
              {uploading ? "Uploading card…" : linkCopied ? "Link copied!" : "Copy unique link"}
            </button>

            {/* Social share */}
            <div>
              <p className="text-xs text-white/30 text-center mb-3">Share on</p>
              <div className="flex items-stretch gap-2">
                <button onClick={handleShareLinkedIn} disabled={uploading || !isCardReady}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/12 hover:border-[#0077B5] hover:bg-[#0077B5]/10 transition-all text-xs text-white/45 hover:text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  {uploading
                    ? <Loader2 size={13} className="animate-spin" />
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                  }
                  LinkedIn
                </button>

                <button onClick={handleShareFacebook} disabled={uploading || !isCardReady}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/12 hover:border-[#1877F2] hover:bg-[#1877F2]/10 transition-all text-xs text-white/45 hover:text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  {uploading
                    ? <Loader2 size={13} className="animate-spin" />
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                  }
                  Facebook
                </button>

                <button onClick={handleDownload} disabled={!isCardReady}
                  title="Download then share on Instagram"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/12 hover:border-[#E1306C] hover:bg-[#E1306C]/10 transition-all text-xs text-white/45 hover:text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </button>
              </div>
              <p className="text-[11px] text-white/22 text-center mt-2">
                LinkedIn &amp; Facebook show your card as a link preview · Instagram: download then post
              </p>
            </div>
          </div>

          {/* ── Canvas preview ── */}
          <div className="sticky top-6">
            <p className="text-xs text-white/30 text-center mb-3">
              Live preview · {SIZES[sizeKey].sub}
            </p>
            <div className="relative rounded-2xl overflow-hidden"
              style={{
                boxShadow: isVip
                  ? "0 0 80px rgba(255,184,0,0.14), 0 0 0 1px rgba(255,184,0,0.12)"
                  : "0 0 80px rgba(49,107,255,0.14), 0 0 0 1px rgba(49,107,255,0.12)",
              }}>
              <canvas ref={canvasRef} width={CW} height={CH}
                style={{ width: "100%", height: "auto", display: "block" }} />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-white" />
                    <p className="text-sm text-white/80">Uploading card…</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-white/22 text-center mt-3">
              {SIZES[sizeKey].label} · Optimised for LinkedIn, Instagram &amp; Facebook
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
