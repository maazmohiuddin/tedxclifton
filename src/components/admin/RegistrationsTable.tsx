"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight, Download, Eye, MailCheck, Search, X,
  CheckSquare, Square, CheckCircle2, Trash2, Copy,
} from "lucide-react";
import type { InviteInfo, Registration, RegistrationTrack } from "@/lib/types";
import { TRACK_LABELS } from "@/lib/types";

const VIP_TRACKS: RegistrationTrack[] = ["vip", "partner"];
const DELEGATE_TRACKS: RegistrationTrack[] = ["general", "student"];

type TrackFilter = "all" | "vip" | "delegates";

const FILTER_LABELS: Record<TrackFilter, string> = {
  all:       "All",
  vip:       "VIP / Patrons",
  delegates: "Attendees",
};

function exportToExcel(rows: Registration[]) {
  import("xlsx").then(XLSX => {
    const data = rows.map(r => ({
      ID:               r.id.slice(0, 8).toUpperCase(),
      "Full Name":      r.full_name,
      Email:            r.email,
      Phone:            r.phone ?? "",
      Organisation:     r.organisation ?? "",
      Role:             r.role,
      Track:            TRACK_LABELS[r.track],
      Referral:         r.referral ?? "",
      Status:           r.confirmed_at ? "Confirmed" : "Pending",
      "Confirmed At":   r.confirmed_at ?? "",
      "Admin Note":     r.admin_note ?? "",
      "Registered At":  r.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, `khinext-registrations-${new Date().toISOString().slice(0, 10)}.xlsx`);
  });
}

export function RegistrationsTable({
  items,
  invitedEmails,
}: {
  items: Registration[];
  invitedEmails: Record<string, InviteInfo>;
}) {
  const [search, setSearch]               = useState("");
  const [trackFilter, setTrackFilter]     = useState<TrackFilter>("all");
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkWorking, setBulkWorking]     = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen]       = useState(false);
  const [dedupConfirmOpen, setDedupConfirmOpen]         = useState(false);
  const [confirmAllPendingOpen, setConfirmAllPendingOpen] = useState(false);
  const [localItems, setLocalItems]       = useState<Registration[]>(items);
  const [toast, setToast]                 = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  }

  const duplicateCount = useMemo(() => {
    const emailCounts = new Map<string, number>();
    for (const r of localItems) {
      const k = r.email.toLowerCase();
      emailCounts.set(k, (emailCounts.get(k) ?? 0) + 1);
    }
    let dupes = 0;
    emailCounts.forEach(count => { if (count > 1) dupes += count - 1; });
    return dupes;
  }, [localItems]);

  const filtered = useMemo(() => {
    let list = localItems;
    if (trackFilter === "vip")       list = list.filter(r => VIP_TRACKS.includes(r.track));
    if (trackFilter === "delegates") list = list.filter(r => DELEGATE_TRACKS.includes(r.track));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.organisation ?? "").toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        TRACK_LABELS[r.track].toLowerCase().includes(q)
      );
    }
    return list;
  }, [localItems, search, trackFilter]);

  const counts = useMemo(() => ({
    all:       localItems.length,
    vip:       localItems.filter(r => VIP_TRACKS.includes(r.track)).length,
    delegates: localItems.filter(r => DELEGATE_TRACKS.includes(r.track)).length,
  }), [localItems]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id));

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(r => next.add(r.id));
        return next;
      });
    }
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  async function bulkConfirm() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkWorking(true);
    try {
      const res = await fetch("/api/admin/registrations/bulk-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      const now = new Date().toISOString();
      setLocalItems(prev =>
        prev.map(r => ids.includes(r.id) && !r.confirmed_at ? { ...r, confirmed_at: now } : r)
      );
      showToast(`${json.confirmed} registration${json.confirmed === 1 ? "" : "s"} confirmed ✓`);
      exitSelectionMode();
    } catch (e) {
      showToast(`Failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setBulkWorking(false);
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkWorking(true);
    setDeleteConfirmOpen(false);
    try {
      const res = await fetch("/api/admin/registrations/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setLocalItems(prev => prev.filter(r => !ids.includes(r.id)));
      showToast(`${ids.length} registration${ids.length === 1 ? "" : "s"} deleted.`);
      exitSelectionMode();
    } catch (e) {
      showToast(`Failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setBulkWorking(false);
    }
  }

  async function removeDuplicates() {
    setDedupConfirmOpen(false);
    setBulkWorking(true);
    try {
      const res = await fetch("/api/admin/registrations/remove-duplicates", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (json.removed > 0) {
        showToast(`${json.removed} duplicate${json.removed === 1 ? "" : "s"} removed.`);
        window.location.reload();
      } else {
        showToast("No duplicates found.");
      }
    } catch (e) {
      showToast(`Failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setBulkWorking(false);
    }
  }

  const pendingCount = useMemo(
    () => localItems.filter(r => !r.confirmed_at).length,
    [localItems]
  );

  async function confirmAllPending() {
    setConfirmAllPendingOpen(false);
    const ids = localItems.filter(r => !r.confirmed_at).map(r => r.id);
    if (ids.length === 0) return;
    setBulkWorking(true);
    try {
      const res = await fetch("/api/admin/registrations/bulk-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      const now = new Date().toISOString();
      setLocalItems(prev => prev.map(r => !r.confirmed_at ? { ...r, confirmed_at: now } : r));
      showToast(`${json.confirmed} registration${json.confirmed === 1 ? "" : "s"} confirmed ✓`);
    } catch (e) {
      showToast(`Failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setBulkWorking(false);
    }
  }

  if (localItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-white/45">
        No registrations yet.
      </div>
    );
  }

  const selectedCount = selected.size;

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, org…"
            className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] pl-8 pr-8 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-khi-blue/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Track filter pills */}
          <div className="flex gap-1">
            {(["all", "vip", "delegates"] as TrackFilter[]).map(f => {
              const active = trackFilter === f;
              return (
                <button key={f} onClick={() => setTrackFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors border ${
                    active
                      ? f === "vip"
                        ? "bg-[#FCBF17]/15 border-[#FCBF17]/40 text-[#FCBF17]"
                        : "bg-khi-blue/15 border-khi-blue/40 text-khi-blue-soft"
                      : "bg-transparent border-white/10 text-white/45 hover:border-white/25"
                  }`}>
                  {FILTER_LABELS[f]}
                  <span className="ml-1.5 text-[10px] opacity-60">{counts[f]}</span>
                </button>
              );
            })}
          </div>

          {/* Select mode toggle */}
          <button
            onClick={() => { setSelectionMode(s => !s); setSelected(new Set()); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              selectionMode
                ? "bg-khi-blue/15 border-khi-blue/40 text-khi-blue-soft"
                : "border-white/10 text-white/45 hover:border-white/25"
            }`}
          >
            <CheckSquare size={11} />
            {selectionMode ? "Cancel" : "Select"}
          </button>

          {/* Remove duplicates */}
          {duplicateCount > 0 && (
            <button
              onClick={() => setDedupConfirmOpen(true)}
              disabled={bulkWorking}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#FF6B8E]/30 text-[#FF6B8E] bg-[#FF6B8E]/[0.06] hover:bg-[#FF6B8E]/10 transition-colors"
            >
              <Copy size={11} />
              {duplicateCount} duplicate{duplicateCount === 1 ? "" : "s"}
            </button>
          )}

          {/* Confirm all pending */}
          {pendingCount > 0 && (
            <button
              onClick={() => setConfirmAllPendingOpen(true)}
              disabled={bulkWorking}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#51FFD5]/30 text-[#51FFD5] bg-[#51FFD5]/[0.06] hover:bg-[#51FFD5]/10 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={11} />
              Confirm all pending ({pendingCount})
            </button>
          )}

          {/* Export */}
          <button
            onClick={() => exportToExcel(filtered)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/10 text-white/45 hover:border-white/25 transition-colors">
            <Download size={11} />
            Export
          </button>
        </div>
      </div>

      {/* Results summary */}
      {(search || trackFilter !== "all") && (
        <p className="text-[11px] text-white/35">
          Showing {filtered.length} of {localItems.length} registrations
          {trackFilter !== "all" && ` · ${FILTER_LABELS[trackFilter]}`}
          {search && ` · "${search}"`}
        </p>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-white/35 text-sm">
          No registrations match your filters.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
          {/* Desktop header */}
          <div
            className="hidden md:grid items-center gap-4 px-6 py-3 text-[10px] font-bold uppercase text-white/30 bg-white/[0.02] border-b border-white/10"
            style={{
              gridTemplateColumns: selectionMode
                ? "28px 70px 1.4fr 1.6fr 130px 120px 110px 28px"
                : "70px 1.4fr 1.6fr 130px 120px 110px 28px",
              letterSpacing: "0.18em",
            }}
            aria-hidden="true"
          >
            {selectionMode && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center justify-center text-white/40 hover:text-white transition-colors"
                aria-label={allFilteredSelected ? "Deselect all" : "Select all"}
              >
                {allFilteredSelected
                  ? <CheckSquare size={13} className="text-khi-blue-soft" />
                  : <Square size={13} />}
              </button>
            )}
            <span>ID</span>
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Invited</span>
            <span />
          </div>

          <ul>
            {filtered.map(r => {
              const confirmed  = !!r.confirmed_at;
              const isVip      = VIP_TRACKS.includes(r.track);
              const invite     = invitedEmails[r.email.toLowerCase()];
              const isSelected = selected.has(r.id);
              const statusColor = confirmed
                ? { text: "#51FFD5", bg: "rgba(81,255,213,0.10)", border: "rgba(81,255,213,0.32)", label: "Confirmed" }
                : { text: "#FFD06B", bg: "rgba(255,184,0,0.10)", border: "rgba(255,184,0,0.32)", label: "Pending" };

              return (
                <li key={r.id} className={`group border-b border-white/10 last:border-b-0 ${isSelected ? "bg-khi-blue/[0.06]" : ""}`}>
                  {selectionMode ? (
                    <button
                      type="button"
                      onClick={() => toggleSelect(r.id)}
                      className="w-full text-left grid md:items-center gap-2 md:gap-4 px-5 md:px-6 py-5 hover:bg-khi-blue/[0.05] transition-colors duration-200"
                    >
                      {/* Desktop */}
                      <div
                        className="hidden md:grid items-center gap-4"
                        style={{ gridTemplateColumns: "28px 70px 1.4fr 1.6fr 130px 120px 110px 28px" }}
                      >
                        <span className={`flex items-center justify-center ${isSelected ? "text-khi-blue-soft" : "text-white/30"}`}>
                          {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                        </span>
                        <span className="font-mono text-xs text-white/45">{r.id.slice(0, 8).toUpperCase()}</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-white font-medium truncate">{r.full_name}</span>
                          {isVip && <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FCBF17]/15 text-[#FCBF17] border border-[#FCBF17]/30">VIP</span>}
                        </div>
                        <span className="text-xs text-white/55 truncate">{r.email}</span>
                        <span className="text-sm text-white/70 truncate">{r.role}</span>
                        <Pill colors={statusColor} />
                        <InviteBadge invite={invite} confirmed={confirmed} />
                        <span />
                      </div>
                      <div className="hidden md:block" style={{ paddingLeft: "calc(28px + 70px + 32px)", marginTop: "-4px" }}>
                        <span className={`text-[11px] ${isVip ? "text-[#FCBF17]/70" : "text-khi-blue-soft/70"}`}>{TRACK_LABELS[r.track]}</span>
                      </div>
                      {/* Mobile */}
                      <div className="md:hidden flex items-start gap-3">
                        <span className={`mt-1 flex-shrink-0 ${isSelected ? "text-khi-blue-soft" : "text-white/30"}`}>
                          {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                        </span>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <span className="font-mono text-[11px] text-white/30">{r.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-white font-medium truncate">{r.full_name}</span>
                          <span className="text-xs text-white/55 truncate">{r.email}</span>
                          <span className="text-[11px] text-white/45">{r.role} · {TRACK_LABELS[r.track]}</span>
                        </div>
                        <Pill colors={statusColor} />
                      </div>
                    </button>
                  ) : (
                    <Link
                      href={`/admin/registrations/${r.id}`}
                      className="grid md:items-center gap-2 md:gap-4 px-5 md:px-6 py-5 hover:bg-khi-blue/[0.05] transition-colors duration-200 ease-soft focus-visible:bg-khi-blue/[0.05] focus-visible:outline-none"
                      style={{ gridTemplateColumns: "1fr" }}
                      aria-label={`Open registration for ${r.full_name}`}
                    >
                      {/* Desktop */}
                      <div
                        className="hidden md:grid items-center gap-4"
                        style={{ gridTemplateColumns: "70px 1.4fr 1.6fr 130px 120px 110px 28px" }}
                      >
                        <span className="font-mono text-xs text-white/45">{r.id.slice(0, 8).toUpperCase()}</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-white font-medium truncate">{r.full_name}</span>
                          {isVip && (
                            <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FCBF17]/15 text-[#FCBF17] border border-[#FCBF17]/30">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white/55 truncate">{r.email}</span>
                        <span className="text-sm text-white/70 truncate">{r.role}</span>
                        <Pill colors={statusColor} />
                        <InviteBadge invite={invite} confirmed={confirmed} />
                        <ChevronRight size={14} className="text-white/30 group-hover:text-white/70 transition-colors" aria-hidden="true" />
                      </div>
                      <div className="hidden md:block ml-[86px] -mt-1">
                        <span className={`text-[11px] ${isVip ? "text-[#FCBF17]/70" : "text-khi-blue-soft/70"}`}>{TRACK_LABELS[r.track]}</span>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-mono text-[11px] text-white/30">{r.id.slice(0, 8).toUpperCase()}</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-medium truncate">{r.full_name}</span>
                              {isVip && <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FCBF17]/15 text-[#FCBF17] border border-[#FCBF17]/30">VIP</span>}
                              {(invite || confirmed) && <InviteBadge invite={invite} confirmed={confirmed} />}
                            </div>
                            <span className="text-xs text-white/55 truncate">{r.email}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Pill colors={statusColor} />
                            <ChevronRight size={14} className="text-white/30" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 text-[11px]">
                          <span className="text-white/45">{r.role}</span>
                          <span className={isVip ? "text-[#FCBF17]/70" : "text-khi-blue-soft/70"}>{TRACK_LABELS[r.track]}</span>
                        </div>
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Floating bulk action bar */}
      <AnimatePresence>
        {selectionMode && selectedCount > 0 && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/15 bg-khi-ink/95 backdrop-blur-xl shadow-2xl"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(49,107,255,0.12)" }}
          >
            <span className="text-xs text-white/60 mr-1">
              <strong className="text-white">{selectedCount}</strong> selected
            </span>
            <button
              type="button"
              disabled={bulkWorking}
              onClick={bulkConfirm}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#51FFD5]/15 border border-[#51FFD5]/40 text-[#51FFD5] hover:bg-[#51FFD5]/20 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={13} />
              Confirm {selectedCount}
            </button>
            <button
              type="button"
              disabled={bulkWorking}
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FF6B8E]/10 border border-[#FF6B8E]/30 text-[#FF6B8E] hover:bg-[#FF6B8E]/15 transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              Delete {selectedCount}
            </button>
            <button
              type="button"
              onClick={exitSelectionMode}
              className="text-white/30 hover:text-white transition-colors ml-1"
              aria-label="Cancel selection"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm all pending dialog */}
      {confirmAllPendingOpen && (
        <ConfirmDialog
          title={`Confirm all ${pendingCount} pending registration${pendingCount === 1 ? "" : "s"}?`}
          body={`This will mark ${pendingCount} pending registration${pendingCount === 1 ? "" : "s"} as confirmed. No emails will be sent — use the bulk mailer to email delegate cards separately.`}
          confirmLabel="Confirm all"
          onCancel={() => setConfirmAllPendingOpen(false)}
          onConfirm={confirmAllPending}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteConfirmOpen && (
        <ConfirmDialog
          title={`Delete ${selectedCount} registration${selectedCount === 1 ? "" : "s"}?`}
          body={`This will permanently delete ${selectedCount} registration${selectedCount === 1 ? "" : "s"}. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={bulkDelete}
        />
      )}

      {/* Dedup confirm dialog */}
      {dedupConfirmOpen && (
        <ConfirmDialog
          title={`Remove ${duplicateCount} duplicate registration${duplicateCount === 1 ? "" : "s"}?`}
          body={`For each email with multiple registrations, the newest duplicate${duplicateCount === 1 ? "" : "s"} will be deleted — the oldest entry per email is kept. This cannot be undone.`}
          confirmLabel="Remove duplicates"
          danger
          onCancel={() => setDedupConfirmOpen(false)}
          onConfirm={removeDuplicates}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl bg-khi-ink border border-white/15 text-sm text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function InviteBadge({ invite, confirmed }: { invite: InviteInfo | undefined; confirmed: boolean }) {
  if (!invite) {
    return confirmed ? (
      <span
        title="Slot confirmed but no invitation email sent yet"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border border-[#FFD06B]/35 text-[#FFD06B] bg-[#FFD06B]/[0.08] whitespace-nowrap"
      >
        Not emailed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border border-white/10 text-white/25 bg-transparent whitespace-nowrap">
        Not invited
      </span>
    );
  }
  const date = new Date(invite.last_sent_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
  return (
    <span
      title={`Invited ${invite.times_sent}× · last ${date}${invite.open_count > 0 ? ` · opened ${invite.open_count}×` : ""}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border whitespace-nowrap bg-[#316BFF]/10 border-[#316BFF]/30 text-khi-blue-soft"
    >
      <MailCheck size={9} />
      Invited
      {invite.open_count > 0 && (
        <span className="flex items-center gap-0.5 ml-0.5 text-[#51FFD5]">
          <Eye size={8} />{invite.open_count}
        </span>
      )}
    </span>
  );
}

function Pill({ colors }: { colors: { text: string; bg: string; border: string; label: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs capitalize border w-fit shrink-0"
      style={{ color: colors.text, background: colors.bg, borderColor: colors.border }}
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: colors.text }} />
      {colors.label}
    </span>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] bg-khi-ink-soft/85 backdrop-blur-lg p-5 grid place-items-center"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-[420px] rounded-3xl bg-khi-ink border border-white/15 p-7"
        style={{ boxShadow: "0 30px 100px rgba(0,0,0,0.5)" }}>
        <h3 className="font-display text-lg font-bold text-white -tracking-tight">{title}</h3>
        <p className="mt-3 text-white/65 text-sm leading-relaxed">{body}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button type="button" className="kx-btn-outline" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger
              ? "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#FF6B8E]/15 border border-[#FF6B8E]/40 text-[#FF6B8E] hover:bg-[#FF6B8E]/20 transition-colors"
              : "kx-btn-primary"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
