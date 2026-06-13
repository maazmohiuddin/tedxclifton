"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Copy, Check, ChevronDown, Image as ImageIcon, Search, Download, X } from "lucide-react";
import type { CardShare } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tedxclifton.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

function getImageUrl(id: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/card-images/${id}.jpg`;
}

function getShareUrl(slug: string) {
  return `${SITE_URL.replace(/\/$/, "")}/go/${slug}`;
}

type CardFilter = "all" | "vip" | "std";

const CARD_FILTER_LABELS: Record<CardFilter, string> = {
  all: "All",
  vip: "VIP",
  std: "Standard",
};

function exportCardsToExcel(rows: CardShare[]) {
  import("xlsx").then(XLSX => {
    const data = rows.map(c => ({
      ID:           c.id.slice(0, 8).toUpperCase(),
      Name:         c.name ?? "",
      Designation:  c.designation ?? "",
      Type:         c.template === "vip" ? "VIP" : "Standard",
      "Share URL":  getShareUrl(c.slug),
      "Image URL":  getImageUrl(c.id),
      "Generated At": c.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cards");
    XLSX.writeFile(wb, `tedxclifton-cards-${new Date().toISOString().slice(0, 10)}.xlsx`);
  });
}

function TemplateBadge({ template }: { template: string }) {
  const isVip = template === "vip";
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
      style={
        isVip
          ? { background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.25)" }
          : { background: "rgba(49,107,255,0.1)", color: "#7FA8FF", border: "1px solid rgba(49,107,255,0.22)" }
      }
    >
      {isVip ? "VIP" : "STD"}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      onClick={copy}
      title="Copy link"
      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-white/35 hover:text-white hover:bg-white/8"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

function CardRow({ id, slug, name, designation, template, created_at }: CardShare) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgUrl = getImageUrl(id);
  const shareUrl = getShareUrl(slug);
  const isVip = template === "vip";

  const date = new Date(created_at).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const time = new Date(created_at).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });

  const accentColor = isVip ? "#FFB800" : "#316BFF";

  return (
    <div
      className="group"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.055)" }}
    >
      {/* Compact row */}
      <button
        className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        {/* Left accent bar */}
        <div
          className="w-0.5 h-8 rounded-full flex-shrink-0 opacity-60"
          style={{ background: accentColor }}
        />

        {/* Thumbnail */}
        <div
          className="flex-shrink-0 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center"
          style={{ width: 52, height: 33 }}
        >
          {imgError ? (
            <ImageIcon size={14} className="text-white/20" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl}
              alt={name ?? "card"}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        {/* Name + designation */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight truncate">
            {name || <span className="text-white/25 font-normal italic">No name</span>}
          </p>
          <p className="text-[11px] text-white/38 mt-0.5 truncate leading-tight">
            {designation || <span className="text-white/20">—</span>}
          </p>
        </div>

        {/* Badge */}
        <TemplateBadge template={template} />

        {/* Date */}
        <div className="hidden sm:block text-right min-w-[80px]">
          <p className="text-xs text-white/45 leading-tight">{date}</p>
          <p className="text-[11px] text-white/25 mt-0.5 leading-tight">{time}</p>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={14}
          className="flex-shrink-0 text-white/25 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="mx-5 mb-4 mt-1 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex flex-col sm:flex-row gap-0">

            {/* Card image */}
            <div className="sm:w-52 flex-shrink-0 p-4" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              {imgError ? (
                <div className="w-full rounded-lg bg-white/5 flex items-center justify-center" style={{ aspectRatio: "1.6 / 1" }}>
                  <ImageIcon size={24} className="text-white/15" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl}
                  alt={name ?? "card"}
                  className="w-full rounded-lg object-cover shadow-xl"
                  style={{ aspectRatio: "1.6 / 1" }}
                />
              )}
            </div>

            {/* Meta */}
            <div className="flex-1 p-4 flex flex-col gap-4">
              {/* 2-col info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: "Name", value: name || "—" },
                  { label: "Designation", value: designation || "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30 mb-1">{label}</p>
                    <p className="text-sm text-white font-medium leading-tight">{value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30 mb-1">Template</p>
                  <TemplateBadge template={template} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30 mb-1">Generated</p>
                  <p className="text-sm text-white font-medium leading-tight">{date}</p>
                  <p className="text-xs text-white/35 mt-0.5">{time}</p>
                </div>
              </div>

              {/* Share URL row */}
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30 mb-1.5">Share URL</p>
                <div
                  className="flex items-center gap-0.5 rounded-lg px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="text-xs font-mono text-khi-blue-soft truncate flex-1 min-w-0">{shareUrl}</span>
                  <CopyButton text={shareUrl} />
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/35 hover:text-white hover:bg-white/8 transition-all"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export function CardSharesTable({ items }: { items: CardShare[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CardFilter>("all");

  const counts = useMemo(() => {
    const vip = items.filter(c => c.template === "vip").length;
    return { all: items.length, vip, std: items.length - vip };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter === "vip") list = list.filter(c => c.template === "vip");
    if (filter === "std") list = list.filter(c => c.template !== "vip");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.designation ?? "").toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, search, filter]);

  if (items.length === 0) {
    return (
      <div className="kx-card !p-16 text-center">
        <ImageIcon size={32} className="text-white/10 mx-auto mb-3" />
        <p className="text-sm text-white/35">No cards generated yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-stats */}
      <div className="flex gap-4 mb-4">
        {[
          { label: "VIP cards", val: counts.vip, color: "#FFB800" },
          { label: "Standard cards", val: counts.std, color: "#7FA8FF" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-xl font-extrabold font-display leading-none" style={{ color: s.color }}>{s.val}</span>
            <span className="text-xs text-white/35">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between mb-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, designation…"
            className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] pl-8 pr-8 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-khi-blue/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter pills */}
          <div className="flex gap-1">
            {(["all", "vip", "std"] as CardFilter[]).map(f => {
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors border ${
                    active
                      ? f === "vip"
                        ? "bg-[#FFB800]/15 border-[#FFB800]/40 text-[#FFB800]"
                        : "bg-khi-blue/15 border-khi-blue/40 text-khi-blue-soft"
                      : "bg-transparent border-white/10 text-white/45 hover:border-white/25"
                  }`}>
                  {CARD_FILTER_LABELS[f]}
                  <span className="ml-1.5 text-[10px] opacity-60">{counts[f]}</span>
                </button>
              );
            })}
          </div>

          {/* Export */}
          <button
            onClick={() => exportCardsToExcel(filtered)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#51FFD5]/30 text-[#51FFD5] bg-[#51FFD5]/[0.06] hover:bg-[#51FFD5]/10 transition-colors">
            <Download size={11} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Results summary */}
      {(search || filter !== "all") && (
        <p className="text-[11px] text-white/35 mb-3">
          Showing {filtered.length} of {items.length} cards
          {filter !== "all" && ` · ${CARD_FILTER_LABELS[filter]}`}
          {search && ` · "${search}"`}
        </p>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-white/35 text-sm">
          No cards match your filters.
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
          {/* Column headers */}
          <div className="flex items-center gap-4 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)" }}>
            <div className="w-0.5 flex-shrink-0" />
            <div style={{ width: 52 }} className="flex-shrink-0" />
            <p className="flex-1 text-[10px] uppercase tracking-wider font-semibold text-white/30">Attendee</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30 w-14 text-center">Type</p>
            <p className="hidden sm:block text-[10px] uppercase tracking-wider font-semibold text-white/30 min-w-[80px] text-right">Generated</p>
            <div className="w-3.5 flex-shrink-0" />
          </div>

          {/* Rows */}
          {filtered.map(card => (
            <CardRow key={card.id} {...card} />
          ))}
        </div>
      )}
    </div>
  );
}
