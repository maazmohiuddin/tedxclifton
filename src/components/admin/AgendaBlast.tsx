"use client";

import { useState, useEffect, useRef } from "react";
import {
  CalendarDays, Send, RefreshCw, CheckCircle2,
  Loader2, ChevronDown, ChevronUp, History,
  Search, X, Copy, Mail, List, PenLine, AtSign,
} from "lucide-react";
import { AGENDA_SUBJECT } from "@/lib/email/invitation";
import { useToast, Toasts } from "@/components/admin/Toast";

// ── Types ──────────────────────────────────────────────────────

interface BlastStatus {
  total: number;
  sent: number;
  remaining: number;
  remainingEmails: string[];
}

interface BlastResult {
  ok: boolean;
  total: number;
  sent: number;
  failed: number;
  sentList: string[];
  failedList: { email: string; error: string }[];
  remainingAfter: number;
  message?: string;
}

interface SendRecord {
  id: string;
  email: string;
  delivery_status: string;
  open_count: number;
  opened_at: string | null;
}

interface AgendaLog {
  id: string;
  sent_at: string;
  subject: string;
  total_count: number;
  sent_count: number;
  failed_count: number;
  unique_openers: number;
  records: SendRecord[];
}

// ── Helpers ────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Stat card ─────────────────────────────────────────────────

function StatCard({
  value, label, color, hint,
}: {
  value: number; label: string; color: string; hint?: string;
}) {
  return (
    <div
      className="kx-card !p-4 !rounded-xl text-center"
      title={hint}
    >
      <div
        className="font-display text-3xl font-extrabold -tracking-tight"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-white/45">{label}</div>
    </div>
  );
}

// ── Agenda email preview ───────────────────────────────────────

function AgendaPreview() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function fetchPreview() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bulk-email/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeAgenda: true }),
      });
      if (iframeRef.current) iframeRef.current.srcdoc = await res.text();
    } catch { /* ignore */ }
    setLoading(false);
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) fetchPreview();
  }

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-sm font-medium text-white/70"
      >
        <span className="flex items-center gap-2">
          <Mail size={15} />
          Preview Agenda Email
        </span>
        <span className="flex items-center gap-2">
          {loading && <Loader2 size={13} className="animate-spin text-white/30" />}
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>
      {open && (
        <div className="border-t border-white/10 p-4">
          <p className="text-xs text-white/40 mb-3">
            Subject: <span className="text-white/70 font-medium">{AGENDA_SUBJECT}</span>
          </p>
          <iframe
            ref={iframeRef}
            title="Agenda Email Preview"
            className="w-full rounded-xl border border-white/10"
            style={{ height: 560, background: "#fff" }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export function AgendaBlast() {
  const { toasts, add: toast } = useToast();

  const [status, setStatus] = useState<BlastStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [sendMode, setSendMode] = useState<"batch" | "custom" | "single">("batch");
  const [batchSize, setBatchSize] = useState(200);
  const [customInput, setCustomInput] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BlastResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [history, setHistory] = useState<AgendaLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [showRemaining, setShowRemaining] = useState(false);
  const [remainingSearch, setRemainingSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [historyRecordSearch, setHistoryRecordSearch] = useState("");

  function toggleBatch(id: string) {
    setExpandedLogId(prev => prev === id ? null : id);
    setHistoryRecordSearch("");
  }

  // ── Data loading ───────────────────────────────────────────

  async function loadStatus(silent = false) {
    if (!silent) setLoadingStatus(true);
    try {
      const res = await fetch("/api/admin/agenda-blast/status");
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        if (silent) toast("info", "Status refreshed.");
      }
    } catch {
      if (!silent) toast("error", "Could not load delivery status.");
    }
    setLoadingStatus(false);
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/admin/bulk-email/history");
      const data = await res.json();
      const agendaLogs = (data.logs ?? []).filter(
        (l: AgendaLog) => l.subject === AGENDA_SUBJECT,
      );
      setHistory(agendaLogs);
    } catch { /* ignore */ }
    setLoadingHistory(false);
  }

  useEffect(() => {
    loadStatus();
    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send ───────────────────────────────────────────────────

  function parseEmails(raw: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of raw.split(/[\n,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean)) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) && !seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
    return out;
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSend() {
    if (sendMode === "custom") {
      if (parseEmails(customInput).length === 0) {
        setSendError("Enter at least one valid email address.");
        return;
      }
    }
    if (sendMode === "single") {
      if (!EMAIL_RE.test(singleEmail.trim())) {
        setSendError("Enter a valid email address.");
        return;
      }
    }
    setSending(true);
    setSendError(null);
    setResult(null);
    try {
      const payload = sendMode === "custom"
        ? { specificEmails: parseEmails(customInput) }
        : sendMode === "single"
        ? { specificEmails: [singleEmail.trim().toLowerCase()] }
        : { batchSize };
      const res = await fetch("/api/admin/agenda-blast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Send failed — check logs.";
        setSendError(msg);
        toast("error", msg);
        setSending(false);
        return;
      }
      const r = data as BlastResult;
      setResult(r);
      if (r.message) {
        toast("info", r.message);
      } else if (r.failed === 0) {
        toast("success", `${r.sent} agenda email${r.sent !== 1 ? "s" : ""} delivered successfully.`);
      } else {
        toast("info", `${r.sent} delivered, ${r.failed} failed. Check results below.`);
      }
      await Promise.all([loadStatus(false), loadHistory()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error.";
      setSendError(msg);
      toast("error", msg);
    }
    setSending(false);
  }

  // ── Copy remaining to clipboard ────────────────────────────

  async function copyRemaining() {
    if (!status?.remainingEmails.length) return;
    try {
      await navigator.clipboard.writeText(status.remainingEmails.join("\n"));
      toast("success", `Copied ${status.remainingEmails.length} email addresses to clipboard.`);
    } catch {
      toast("error", "Clipboard access denied — try copying manually.");
    }
  }

  // ── Derived state ──────────────────────────────────────────

  const effectiveBatch = status ? Math.min(batchSize, status.remaining) : 0;
  const canSend = !sending && (status?.remaining ?? 0) > 0;
  const progress = status && status.total > 0
    ? Math.round((status.sent / status.total) * 100) : 0;

  const parsedCustomEmails = parseEmails(customInput);
  const canSendCustom = !sending && parsedCustomEmails.length > 0;
  const canSendSingle = !sending && EMAIL_RE.test(singleEmail.trim());

  const filteredRemaining = remainingSearch.trim()
    ? (status?.remainingEmails ?? []).filter(e =>
        e.toLowerCase().includes(remainingSearch.toLowerCase()),
      )
    : (status?.remainingEmails ?? []);

  const hq = historySearch.trim().toLowerCase();
  const filteredHistory = hq
    ? history.filter(l => fmt(l.sent_at).toLowerCase().includes(hq))
    : history;

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <Toasts toasts={toasts} />

      <div className="space-y-6">

        {/* Intro */}
        <div className="rounded-2xl border border-khi-blue/20 bg-khi-blue/[0.04] px-5 py-4 flex items-start gap-3">
          <CalendarDays size={18} className="text-khi-blue-soft flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">Agenda Blast</p>
            <p className="text-xs text-white/50 mt-0.5">
              Send the TEDxClifton event agenda to every contact in the system — both
              registered attendees and invitation-mailer recipients — in spam-safe batches.
              The pool is automatically de-duplicated and recipients are{" "}
              <strong className="text-white/70">never emailed twice</strong>, even across sessions.
            </p>
          </div>
        </div>

        {/* Delivery status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
              Delivery Status
            </p>
            <button
              onClick={() => loadStatus(true)}
              disabled={loadingStatus}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors disabled:opacity-40"
              title="Refresh counts from the database"
            >
              <RefreshCw size={11} className={loadingStatus ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {loadingStatus ? (
            <div className="flex items-center justify-center py-8 gap-2 text-white/30 text-sm">
              <Loader2 size={14} className="animate-spin" />Loading status…
            </div>
          ) : status ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  value={status.total}
                  label="Total Contacts"
                  color="#316BFF"
                  hint="All unique email addresses across registrations and invitation-mailer history (de-duplicated)."
                />
                <StatCard
                  value={status.sent}
                  label="Agenda Sent"
                  color="#51FFD5"
                  hint="Recipients who have already received the agenda email in a previous blast."
                />
                <StatCard
                  value={status.remaining}
                  label="Remaining"
                  color={status.remaining > 0 ? "#FCBF17" : "rgba(255,255,255,0.2)"}
                  hint="Invitees who have not yet received the agenda. These will be targeted in the next batch."
                />
              </div>

              {/* Progress bar */}
              {status.total > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/35">Agenda delivery progress</span>
                    <span className="text-white/55 font-semibold tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #316BFF, #51FFD5)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-4">Failed to load status.</p>
          )}
        </div>

        {/* Email preview */}
        <AgendaPreview />

        {/* Send panel */}
        {status && (
          <div className="kx-card !p-5 !rounded-2xl space-y-4">

            {/* Header + mode toggle */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-semibold text-white">Send Agenda</p>
              <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                <button
                  onClick={() => { setSendMode("batch"); setSendError(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sendMode === "batch"
                      ? "bg-white/[0.08] text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <List size={12} />
                  Next Batch
                </button>
                <button
                  onClick={() => { setSendMode("custom"); setSendError(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sendMode === "custom"
                      ? "bg-white/[0.08] text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <PenLine size={12} />
                  Custom List
                </button>
                <button
                  onClick={() => { setSendMode("single"); setSendError(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sendMode === "single"
                      ? "bg-white/[0.08] text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <AtSign size={12} />
                  Single
                </button>
              </div>
            </div>

            {/* ── Batch mode ── */}
            {sendMode === "batch" && (
              status.remaining > 0 ? (
                <>
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <label className="kx-label block mb-1.5 text-xs">
                        Batch size
                        <span className="ml-1 text-white/25 font-normal">(1 – 500)</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={batchSize}
                        onChange={e =>
                          setBatchSize(Math.min(500, Math.max(1, Number(e.target.value) || 1)))
                        }
                        className="kx-input rounded-xl w-28 text-sm text-center"
                      />
                    </div>
                    <div className="pb-1 space-y-1">
                      <p className="text-xs text-white/50">
                        Will send to{" "}
                        <strong className="text-white">{effectiveBatch}</strong> of{" "}
                        <strong className="text-white">{status.remaining}</strong> remaining
                      </p>
                      {batchSize > 200 && (
                        <p className="text-[11px] text-amber-400/70">
                          Tip: keep batches ≤ 200 for best deliverability.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => setShowRemaining(v => !v)}
                      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showRemaining ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      {showRemaining ? "Hide" : "Preview"} remaining recipients ({status.remaining})
                    </button>

                    {showRemaining && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                            <input
                              type="search"
                              placeholder="Filter by email…"
                              value={remainingSearch}
                              onChange={e => setRemainingSearch(e.target.value)}
                              className="kx-input w-full rounded-xl pl-8 pr-8 text-xs"
                            />
                            {remainingSearch && (
                              <button
                                onClick={() => setRemainingSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>
                          <button
                            onClick={copyRemaining}
                            title="Copy all remaining emails to clipboard"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-[11px] text-white/50 hover:text-white hover:border-white/25 transition-colors flex-shrink-0"
                          >
                            <Copy size={11} />Copy all
                          </button>
                        </div>

                        {remainingSearch && (
                          <p className="text-[11px] text-white/30 px-1">
                            {filteredRemaining.length} of {status.remaining} match
                          </p>
                        )}

                        <div className="rounded-xl border border-white/10 divide-y divide-white/[0.04] max-h-48 overflow-y-auto">
                          {filteredRemaining.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-white/30 text-center">
                              No emails match &ldquo;{remainingSearch}&rdquo;
                            </p>
                          ) : (
                            filteredRemaining.map(email => (
                              <p key={email} className="px-4 py-2 text-xs font-mono text-white/55">
                                {email}
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {sendError && (
                    <p role="alert" className="text-sm text-red-400">{sendError}</p>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className="kx-btn kx-btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending
                      ? <><Loader2 size={15} className="animate-spin" />Sending…</>
                      : <><Send size={15} />Send Agenda to Next {effectiveBatch} Recipients</>}
                  </button>

                  <p className="text-[11px] text-white/25 text-center">
                    After this batch,{" "}
                    {Math.max(0, status.remaining - effectiveBatch)}{" "}
                    recipient{status.remaining - effectiveBatch !== 1 ? "s" : ""} will remain.
                  </p>
                </>
              ) : (
                <div className="text-center py-4 space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400">
                    <CheckCircle2 size={15} />
                    <p className="text-sm font-medium">All {status.total} contacts reached</p>
                  </div>
                  <p className="text-xs text-white/35">
                    Switch to <strong className="text-white/55">Custom List</strong> to send to specific addresses.
                  </p>
                </div>
              )
            )}

            {/* ── Single mode ── */}
            {sendMode === "single" && (
              <>
                <div>
                  <label className="kx-label block mb-1.5 text-xs">
                    Recipient email address
                  </label>
                  <input
                    type="email"
                    placeholder="someone@example.com"
                    value={singleEmail}
                    onChange={e => { setSingleEmail(e.target.value); setSendError(null); }}
                    className="kx-input w-full rounded-xl text-sm"
                    onKeyDown={e => { if (e.key === "Enter" && canSendSingle) handleSend(); }}
                  />
                </div>

                {sendError && (
                  <p role="alert" className="text-sm text-red-400">{sendError}</p>
                )}

                <button
                  onClick={handleSend}
                  disabled={!canSendSingle}
                  className="kx-btn kx-btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending
                    ? <><Loader2 size={15} className="animate-spin" />Sending…</>
                    : <><Send size={15} />Send Agenda to This Address</>}
                </button>

                <p className="text-[11px] text-white/25 text-center">
                  If this address has already received the agenda, the send will be skipped.
                </p>
              </>
            )}

            {/* ── Custom mode ── */}
            {sendMode === "custom" && (
              <>
                <div>
                  <label className="kx-label block mb-1.5 text-xs">
                    Email addresses
                    <span className="ml-1 text-white/25 font-normal">— comma, semicolon, or newline separated</span>
                  </label>
                  <textarea
                    value={customInput}
                    onChange={e => { setCustomInput(e.target.value); setSendError(null); }}
                    placeholder={"alice@example.com, bob@example.com\nor one per line…"}
                    rows={4}
                    className="kx-input w-full rounded-xl text-xs font-mono resize-y"
                  />
                </div>

                {customInput.trim() && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs">
                    {parsedCustomEmails.length > 0 ? (
                      <p className="text-white/55">
                        <strong className="text-white">{parsedCustomEmails.length}</strong>{" "}
                        valid address{parsedCustomEmails.length !== 1 ? "es" : ""} parsed
                        — addresses already sent the agenda will be skipped automatically.
                      </p>
                    ) : (
                      <p className="text-amber-400/70">
                        No valid email addresses found — check formatting.
                      </p>
                    )}
                  </div>
                )}

                {sendError && (
                  <p role="alert" className="text-sm text-red-400">{sendError}</p>
                )}

                <button
                  onClick={handleSend}
                  disabled={!canSendCustom}
                  className="kx-btn kx-btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending
                    ? <><Loader2 size={15} className="animate-spin" />Sending…</>
                    : <><Send size={15} />Send Agenda to {parsedCustomEmails.length} Email{parsedCustomEmails.length !== 1 ? "s" : ""}</>}
                </button>

                <p className="text-[11px] text-white/25 text-center">
                  Addresses that have already received the agenda are automatically excluded.
                </p>
              </>
            )}

          </div>
        )}

        {/* Last batch result */}
        {result && (
          <div
            className={`rounded-2xl border px-5 py-4 space-y-3 ${
              result.failed === 0
                ? "border-emerald-500/25 bg-emerald-500/[0.05]"
                : "border-amber-500/25 bg-amber-500/[0.05]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  result.failed === 0 ? "bg-emerald-500/20" : "bg-amber-500/20"
                }`}
              >
                <Send size={14} className={result.failed === 0 ? "text-emerald-400" : "text-amber-400"} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {result.message
                    ?? (result.failed === 0
                      ? "Batch sent successfully!"
                      : "Batch sent with some failures")}
                </p>
                <p className="text-xs text-white/45 mt-0.5">
                  {result.sent} delivered · {result.failed} failed ·{" "}
                  {result.remainingAfter} still remaining
                </p>
              </div>
            </div>

            {result.failedList.length > 0 && (
              <div className="rounded-xl bg-red-500/5 border border-red-500/15 divide-y divide-white/[0.04] max-h-32 overflow-y-auto">
                {result.failedList.map(f => (
                  <div key={f.email} className="px-4 py-2">
                    <p className="text-xs font-mono text-red-300/80">{f.email}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{f.error}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blast history */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <History size={13} className="text-white/40" />
              <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
                Agenda Blast History
              </p>
            </div>

            {/* History search */}
            {history.length > 1 && (
              <div className="relative">
                <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Filter by date…"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="kx-input rounded-xl pl-8 pr-8 text-xs w-44"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )}
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-6 gap-2 text-white/30 text-sm">
              <Loader2 size={14} className="animate-spin" />Loading…
            </div>
          ) : history.length === 0 ? (
            <div className="kx-card !p-8 !rounded-2xl text-center">
              <p className="text-white/30 text-sm">No agenda blasts sent yet.</p>
              <p className="text-white/20 text-xs mt-1">
                History will appear here after your first batch.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="kx-card !p-8 !rounded-2xl text-center">
              <p className="text-white/30 text-sm">No batches match &ldquo;{historySearch}&rdquo;</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map(log => {
                const openRate = log.sent_count > 0
                  ? `${Math.round((log.unique_openers / log.sent_count) * 100)}%`
                  : "—";
                const isExpanded = expandedLogId === log.id;
                const recs = (log.records ?? []) as SendRecord[];
                const rq = historyRecordSearch.trim().toLowerCase();
                const filteredRecs = rq
                  ? recs.filter(r => r.email.toLowerCase().includes(rq))
                  : recs;

                return (
                  <div key={log.id} className="kx-card !rounded-xl overflow-hidden">
                    {/* Row header — click to expand */}
                    <button
                      onClick={() => toggleBatch(log.id)}
                      className="w-full flex flex-wrap items-center gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">{fmt(log.sent_at)}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">
                          Batch · {log.total_count} targeted
                        </p>
                      </div>
                      <div className="flex items-center gap-5 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-sm font-bold text-emerald-400">{log.sent_count}</p>
                          <p className="text-[10px] text-white/30">Delivered</p>
                        </div>
                        <div className="text-center">
                          <p
                            className="text-sm font-bold"
                            style={{ color: log.failed_count > 0 ? "#FF6B6B" : "rgba(255,255,255,0.2)" }}
                          >
                            {log.failed_count}
                          </p>
                          <p className="text-[10px] text-white/30">Failed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-blue-300">{log.unique_openers}</p>
                          <p className="text-[10px] text-white/30">Opened</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-white/60">{openRate}</p>
                          <p className="text-[10px] text-white/30">Open rate</p>
                        </div>
                        <div className="text-white/30">
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>
                      </div>
                    </button>

                    {/* Expanded recipient list */}
                    {isExpanded && (
                      <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 space-y-3">
                        {/* Search bar */}
                        {recs.length > 5 && (
                          <div className="relative">
                            <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                            <input
                              type="search"
                              placeholder="Filter recipients…"
                              value={historyRecordSearch}
                              onChange={e => setHistoryRecordSearch(e.target.value)}
                              className="kx-input w-full rounded-xl pl-8 pr-8 text-xs"
                            />
                            {historyRecordSearch && (
                              <button
                                onClick={() => setHistoryRecordSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>
                        )}

                        {historyRecordSearch && (
                          <p className="text-[11px] text-white/30 px-1">
                            {filteredRecs.length} of {recs.length} match
                          </p>
                        )}

                        {/* Recipient rows */}
                        <div className="rounded-xl border border-white/[0.08] divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                          {filteredRecs.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-white/30 text-center">
                              {historyRecordSearch
                                ? `No recipients match "${historyRecordSearch}"`
                                : "No records for this batch."}
                            </p>
                          ) : (
                            filteredRecs.map(rec => (
                              <div key={rec.id} className="flex items-center justify-between gap-3 px-4 py-2">
                                <p className="text-xs font-mono text-white/60 truncate min-w-0">{rec.email}</p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {rec.open_count > 0 && (
                                    <span className="text-[10px] text-blue-300/80 font-medium">
                                      opened{rec.open_count > 1 ? ` ×${rec.open_count}` : ""}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                                      rec.delivery_status === "sent"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : rec.delivery_status === "failed"
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-white/5 text-white/30"
                                    }`}
                                  >
                                    {rec.delivery_status}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
