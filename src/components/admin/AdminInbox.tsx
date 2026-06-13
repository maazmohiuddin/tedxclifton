"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, Reply, RefreshCw, Inbox, X, CheckCheck,
  AtSign, Globe, Star, Archive, Trash2, MailOpen, Mail,
  MailCheck, ArrowLeft, CheckSquare, Square, Send as SendIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ContactMessage, ContactSource, ContactStatus, ContactReply } from "@/lib/types";

// ── helpers ────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(iso).toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = ["#316BFF","#BF00FF","#00EAEE","#FF0F4B","#FF4D00","#FCBF17","#51FFD5"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

function normalizeSubject(s: string): string {
  return (s || "")
    .replace(/^(\s*(re|fwd|fw)\s*:\s*)+/i, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function threadKeyOf(m: ContactMessage): string {
  return `${m.email.toLowerCase()}::${normalizeSubject(m.subject)}`;
}

const SOURCE_LABEL: Record<ContactSource, string> = { contact_form: "Form", email: "Email" };
const SOURCE_STYLE: Record<ContactSource, string> = {
  contact_form: "bg-[#BF00FF]/10 text-[#D580FF] border-[#BF00FF]/30",
  email: "bg-[#FFB800]/10 text-[#FFD06B] border-[#FFB800]/30",
};
const SOURCE_ICON: Record<ContactSource, React.ReactNode> = {
  contact_form: <Globe size={9} />,
  email: <AtSign size={9} />,
};

const STATUS_STYLE: Record<ContactStatus, string> = {
  new:     "bg-khi-blue/20 text-khi-blue-soft border-khi-blue/40",
  read:    "bg-white/[0.06] text-white/40 border-white/10",
  replied: "bg-[#51FFD5]/10 text-[#51FFD5] border-[#51FFD5]/30",
};

interface ToastState { message: string; type: "success" | "error" | "info" }

type Folder = "inbox" | "important" | "archived" | "trash";

interface Thread {
  key: string;
  email: string;
  name: string;
  subject: string;
  messages: ContactMessage[];
  latest: ContactMessage;
  unread: boolean;
  important: boolean;
  source: ContactSource;
  lastAt: string;
  count: number;
}

interface SentRecord {
  id: string;
  sent_at: string;
  delivery_status: string;
  smtp_message_id: string | null;
  subject: string;
}

function buildThreads(list: ContactMessage[]): Thread[] {
  const map = new Map<string, ContactMessage[]>();
  for (const m of list) {
    const k = threadKeyOf(m);
    const arr = map.get(k);
    if (arr) arr.push(m);
    else map.set(k, [m]);
  }
  const threads: Thread[] = [];
  map.forEach((msgs, key) => {
    const sorted = [...msgs].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    const latest = sorted[sorted.length - 1];
    const replyCount = sorted.reduce((n, m) => n + (m.replies?.length ?? 0), 0);
    threads.push({
      key,
      email: latest.email,
      name: latest.name,
      subject: latest.subject,
      messages: sorted,
      latest,
      unread: sorted.some(m => m.status === "new"),
      important: sorted.some(m => m.important),
      source: latest.source ?? "contact_form",
      lastAt: latest.created_at,
      count: sorted.length + replyCount,
    });
  });
  return threads.sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));
}

async function patchMessage(id: string, patch: Record<string, unknown>) {
  return fetch(`/api/admin/contact/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

// ── component ──────────────────────────────────────────────────

export function AdminInbox({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const [messages, setMessages] = useState<ContactMessage[]>(
    initialMessages.map(m => ({ ...m, important: m.important ?? false, archived: m.archived ?? false, deleted_at: m.deleted_at ?? null }))
  );
  const [selectedKey, setSelectedKey]   = useState<string | null>(null);
  const [folder, setFolder]             = useState<Folder>("inbox");
  const [search, setSearch]             = useState("");
  const [replyText, setReplyText]       = useState("");
  const [sending, setSending]           = useState(false);
  const [confirming, setConfirming]     = useState(false);
  const [syncing, setSyncing]           = useState(false);
  const [toast, setToast]               = useState<ToastState | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  // Bulk selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys]   = useState<Set<string>>(new Set());
  // Sent history for active thread
  const [sentHistory, setSentHistory]     = useState<SentRecord[]>([]);
  const [loadingSent, setLoadingSent]     = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3800);
  }

  const applyPatch = useCallback((id: string, patch: Partial<ContactMessage>) => {
    setMessages(p => p.map(m => m.id === id ? { ...m, ...patch } : m));
    patchMessage(id, patch).catch(() => showToast("Update failed", "error"));
  }, []);

  const refreshMessages = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (data) setMessages((data as ContactMessage[]).map(m => ({
      ...m, important: m.important ?? false, archived: m.archived ?? false, deleted_at: m.deleted_at ?? null,
    })));
  }, []);

  const runSync = useCallback(async (silent: boolean) => {
    setSyncing(true);
    try {
      const res  = await fetch("/api/admin/inbox/gmail-sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) { if (!silent) showToast(`Sync failed: ${data.error}`, "error"); }
      else {
        await refreshMessages();
        if (data.imported) showToast(`Fetched ${data.imported} new email${data.imported > 1 ? "s" : ""} from Gmail`, "success");
        else if (!silent) showToast("Gmail inbox is up to date", "info");
      }
    } catch { if (!silent) showToast("Network error during sync", "error"); }
    finally  { setSyncing(false); }
  }, [refreshMessages]);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel("inbox-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, payload => {
        if (payload.eventType === "INSERT") {
          const msg = payload.new as ContactMessage;
          setMessages(p => p.some(m => m.id === msg.id) ? p : [{ ...msg, important: msg.important ?? false, archived: msg.archived ?? false, deleted_at: msg.deleted_at ?? null }, ...p]);
          showToast(`${msg.source === "email" ? "📧" : "📝"} ${msg.name}`, "info");
        }
        if (payload.eventType === "UPDATE") {
          const upd = payload.new as ContactMessage;
          setMessages(p => p.map(m => m.id === upd.id ? upd : m));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => { runSync(true); }, [runSync]);

  // Fetch sent invitation history when a thread is opened
  useEffect(() => {
    if (!selectedKey) { setSentHistory([]); return; }
    const email = selectedKey.split("::")[0];
    if (!email) return;
    setLoadingSent(true);
    fetch(`/api/admin/contact/sent-history?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then((data: SentRecord[]) => setSentHistory(Array.isArray(data) ? data : []))
      .catch(() => setSentHistory([]))
      .finally(() => setLoadingSent(false));
  }, [selectedKey]);

  // ── filtering + threading ─────────────────────────────────────

  const folderMessages = useMemo(() => ({
    inbox:     messages.filter(m => !m.archived && !m.deleted_at),
    important: messages.filter(m => m.important && !m.deleted_at),
    archived:  messages.filter(m => m.archived && !m.deleted_at),
    trash:     messages.filter(m => !!m.deleted_at),
  }), [messages]);

  const threads = useMemo(() => {
    let list = folderMessages[folder];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) || m.message.toLowerCase().includes(q));
    }
    return buildThreads(list);
  }, [folderMessages, folder, search]);

  const selected = useMemo(
    () => threads.find(t => t.key === selectedKey) ?? null,
    [threads, selectedKey]
  );

  const counts = useMemo(() => ({
    inbox:     folderMessages.inbox.filter(m => m.status === "new").length,
    important: folderMessages.important.filter(m => m.status === "new").length,
    archived:  buildThreads(folderMessages.archived).length,
    trash:     buildThreads(folderMessages.trash).length,
  }), [folderMessages]);

  const FOLDERS: { id: Folder; label: string; icon: React.ReactNode }[] = [
    { id: "inbox",     label: "Inbox",     icon: <Inbox size={14} /> },
    { id: "important", label: "Important", icon: <Star size={14} /> },
    { id: "archived",  label: "Archived",  icon: <Archive size={14} /> },
    { id: "trash",     label: "Trash",     icon: <Trash2 size={14} /> },
  ];

  // ── single-thread actions ─────────────────────────────────────

  function openThread(t: Thread) {
    if (selectionMode) { toggleSelect(t.key); return; }
    setSelectedKey(t.key);
    setReplyText("");
    setConfirming(false);
    setMobileDetail(true);
    t.messages.forEach(m => { if (m.status === "new") applyPatch(m.id, { status: "read" }); });
  }

  function toggleImportant(t: Thread, e?: React.MouseEvent) {
    e?.stopPropagation();
    const next = !t.important;
    t.messages.forEach(m => applyPatch(m.id, { important: next }));
  }

  function archiveThread(t: Thread, e?: React.MouseEvent) {
    e?.stopPropagation();
    t.messages.forEach(m => applyPatch(m.id, { archived: true }));
    if (selectedKey === t.key) setSelectedKey(null);
    showToast("Conversation archived", "success");
  }

  function unarchiveThread(t: Thread) {
    t.messages.forEach(m => applyPatch(m.id, { archived: false }));
    showToast("Moved to inbox", "info");
  }

  function deleteThread(t: Thread, e?: React.MouseEvent) {
    e?.stopPropagation();
    const now = new Date().toISOString();
    t.messages.forEach(m => applyPatch(m.id, { deleted_at: now }));
    if (selectedKey === t.key) setSelectedKey(null);
    showToast("Moved to trash", "info");
  }

  function restoreThread(t: Thread) {
    t.messages.forEach(m => applyPatch(m.id, { deleted_at: null }));
    showToast("Restored", "success");
  }

  function markUnread(t: Thread) {
    applyPatch(t.latest.id, { status: "new" });
    showToast("Marked as unread", "info");
  }

  // ── bulk selection ────────────────────────────────────────────

  function toggleSelect(key: string) {
    setSelectedKeys(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  }

  function toggleAll() {
    if (selectedKeys.size === threads.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(threads.map(t => t.key)));
    }
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedKeys(new Set());
  }

  function bulkArchive() {
    const targets = threads.filter(t => selectedKeys.has(t.key));
    targets.forEach(t => archiveThread(t));
    exitSelectionMode();
    showToast(`Archived ${targets.length} conversation${targets.length > 1 ? "s" : ""}`, "success");
  }

  function bulkDelete() {
    const targets = threads.filter(t => selectedKeys.has(t.key));
    targets.forEach(t => deleteThread(t));
    exitSelectionMode();
    showToast(`Moved ${targets.length} to trash`, "info");
  }

  function bulkMarkRead() {
    const targets = threads.filter(t => selectedKeys.has(t.key));
    targets.forEach(t => t.messages.forEach(m => { if (m.status === "new") applyPatch(m.id, { status: "read" }); }));
    exitSelectionMode();
    showToast(`Marked ${targets.length} as read`, "info");
  }

  // ── reply ─────────────────────────────────────────────────────

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    const target = selected.latest;
    setSending(true);
    setConfirming(false);
    try {
      const res = await fetch(`/api/admin/contact/${target.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: replyText.trim() }),
      });
      if (!res.ok) { const { error } = await res.json().catch(() => ({ error: "Unknown" })); showToast(`Failed: ${error}`, "error"); return; }
      const now = new Date().toISOString();
      const newReply: ContactReply = { text: replyText.trim(), sent_at: now };
      showToast(`Reply sent to ${target.email}`, "success");
      setReplyText("");
      setMessages(p => p.map(m => m.id === target.id
        ? { ...m, status: "replied" as ContactStatus, replies: [...(m.replies ?? []), newReply], reply_text: replyText.trim(), replied_at: now }
        : m));
    } catch { showToast("Network error — reply not sent", "error"); }
    finally  { setSending(false); }
  }

  // ── thread timeline items ─────────────────────────────────────

  type TimelineItem =
    | { kind: "sent"; at: string; subject: string; status: string }
    | { kind: "in";   at: string; name: string; text: string }
    | { kind: "out";  at: string; text: string };

  const threadItems = useMemo((): TimelineItem[] => {
    if (!selected) return [];
    const items: TimelineItem[] = [];
    for (const sent of sentHistory) {
      items.push({ kind: "sent", at: sent.sent_at, subject: sent.subject, status: sent.delivery_status });
    }
    for (const m of selected.messages) {
      items.push({ kind: "in", at: m.created_at, name: m.name, text: m.message });
      const reps = (m.replies?.length ? m.replies : (m.reply_text ? [{ text: m.reply_text, sent_at: m.replied_at ?? m.created_at }] : [])) as ContactReply[];
      for (const r of reps) items.push({ kind: "out", at: r.sent_at, text: r.text });
    }
    return items.sort((a, b) => +new Date(a.at) - +new Date(b.at));
  }, [selected, sentHistory]);

  // ── render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-9 h-9 rounded-xl bg-khi-blue/10 border border-khi-blue/30">
            <Inbox size={16} className="text-khi-blue-soft" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white -tracking-tight">Inbox</h2>
            <p className="text-[11px] text-white/40">hello@tedxclifton.com</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {toast && (
              <motion.span
                key={toast.message + toast.type}
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.2 }}
                className={`text-[11px] px-3 py-1.5 rounded-full border whitespace-nowrap ${
                  toast.type === "success" ? "bg-[#51FFD5]/10 text-[#51FFD5] border-[#51FFD5]/20" :
                  toast.type === "error"   ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  "bg-white/[0.06] text-white/50 border-white/10"
                }`}>
                {toast.message}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => { setSelectionMode(v => !v); if (selectionMode) exitSelectionMode(); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              selectionMode
                ? "border-khi-blue/50 bg-khi-blue/15 text-khi-blue-soft"
                : "border-white/15 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/30"
            }`}>
            <CheckSquare size={11} />
            {selectionMode ? "Cancel" : "Select"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => runSync(false)} disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/15 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50">
            <motion.span animate={syncing ? { rotate: 360 } : { rotate: 0 }}
              transition={syncing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}>
              <RefreshCw size={11} />
            </motion.span>
            {syncing ? "Syncing…" : "Sync"}
          </motion.button>
        </div>
      </div>

      {/* Main */}
      <div className="grid md:grid-cols-[200px_1fr] lg:grid-cols-[220px_360px_1fr] grid-rows-[620px] rounded-2xl border border-white/10 overflow-hidden bg-[#070D1E] h-[620px]">

        {/* ── Sidebar ── */}
        <div className="hidden md:flex flex-col border-r border-white/[0.07] py-3 gap-0.5">
          <div className="px-3 pb-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] pl-7 pr-2 py-1.5 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-khi-blue/40" />
            </div>
          </div>
          {FOLDERS.map(f => {
            const active = folder === f.id;
            return (
              <button key={f.id} onClick={() => { setFolder(f.id); setSelectedKey(null); }}
                className={`relative flex items-center justify-between mx-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${active ? "text-khi-blue-soft" : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"}`}>
                {active && (
                  <motion.span layoutId="folderPillDesktop"
                    className="absolute inset-0 rounded-lg bg-khi-blue/15 ring-1 ring-khi-blue/25"
                    transition={{ type: "spring", stiffness: 480, damping: 38 }} />
                )}
                <span className="relative flex items-center gap-2.5">{f.icon}{f.label}</span>
                {counts[f.id] > 0 && (
                  <span className={`relative text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-khi-blue/30 text-khi-blue-soft" : "bg-white/10 text-white/40"}`}>
                    {counts[f.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Thread list ── */}
        <div className={`flex flex-col border-r border-white/[0.07] ${mobileDetail && selected ? "hidden lg:flex" : "flex"}`}>
          <div className="md:hidden p-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] pl-7 pr-2 py-1.5 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-khi-blue/40" />
            </div>
          </div>
          <div className="md:hidden flex gap-1 px-2 pt-2 pb-1 overflow-x-auto">
            {FOLDERS.map(f => {
              const active = folder === f.id;
              return (
                <button key={f.id} onClick={() => { setFolder(f.id); setSelectedKey(null); }}
                  className={`relative flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${active ? "text-khi-blue-soft" : "text-white/40"}`}>
                  {active && (
                    <motion.span layoutId="folderPillMobile"
                      className="absolute inset-0 rounded-full bg-khi-blue/15 ring-1 ring-khi-blue/40"
                      transition={{ type: "spring", stiffness: 480, damping: 38 }} />
                  )}
                  <span className="relative flex items-center gap-1.5">{f.icon}{f.label}{counts[f.id] > 0 ? ` (${counts[f.id]})` : ""}</span>
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 border-b border-white/[0.05] flex items-center justify-between">
            {selectionMode ? (
              <button onClick={toggleAll} className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white transition-colors">
                {selectedKeys.size === threads.length
                  ? <CheckSquare size={11} className="text-khi-blue-soft" />
                  : <Square size={11} />}
                {selectedKeys.size > 0 ? `${selectedKeys.size} selected` : "Select all"}
              </button>
            ) : (
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                {folder === "inbox" ? "Inbox" : folder === "important" ? "Starred" : folder === "archived" ? "Archive" : "Trash"}
              </span>
            )}
            <span className="text-[10px] text-white/25">{threads.length} {threads.length === 1 ? "thread" : "threads"}</span>
          </div>

          <div className="overflow-y-auto flex-1">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-white/20">
                <Mail size={24} strokeWidth={1.2} />
                <p className="text-xs">Nothing here</p>
              </div>
            ) : (
              <ul>
                <AnimatePresence initial={false}>
                  {threads.map(t => (
                    <motion.li key={t.key} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                      <ThreadRow
                        thread={t}
                        selected={selectedKey === t.key}
                        selectionMode={selectionMode}
                        checked={selectedKeys.has(t.key)}
                        onSelect={() => openThread(t)}
                        onToggleImportant={e => toggleImportant(t, e)}
                        onArchive={e => archiveThread(t, e)}
                        onDelete={e => deleteThread(t, e)}
                        folder={folder}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          {/* Bulk action bar */}
          <AnimatePresence>
            {selectionMode && selectedKeys.size > 0 && (
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="border-t border-white/10 bg-[#0A1020] px-3 py-2.5 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-white/50 mr-1">{selectedKeys.size} selected</span>
                {folder !== "archived" && folder !== "trash" && (
                  <BulkBtn onClick={bulkArchive} icon={<Archive size={10} />} label="Archive" />
                )}
                {folder !== "trash" && (
                  <BulkBtn onClick={bulkDelete} icon={<Trash2 size={10} />} label="Delete" danger />
                )}
                <BulkBtn onClick={bulkMarkRead} icon={<MailCheck size={10} />} label="Mark read" />
                <button onClick={exitSelectionMode} className="ml-auto text-white/30 hover:text-white p-1 rounded transition-colors">
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Detail pane ── */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col min-h-0 overflow-hidden ${mobileDetail && selected ? "flex" : "hidden lg:flex"}`}>

              <div className="px-4 py-3 border-b border-white/[0.06] flex items-start gap-3">
                <button onClick={() => { setSelectedKey(null); setMobileDetail(false); }} className="lg:hidden mt-0.5 text-white/40 hover:text-white transition-colors flex-shrink-0">
                  <ArrowLeft size={16} />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight truncate">
                    {selected.subject.replace(/^(\s*(re|fwd|fw)\s*:\s*)+/i, "") || selected.subject}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${SOURCE_STYLE[selected.source]}`}>
                      {SOURCE_ICON[selected.source]}{SOURCE_LABEL[selected.source]}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${STATUS_STYLE[selected.latest.status]}`}>
                      {selected.latest.status}
                    </span>
                    {selected.count > 1 && <span className="text-[10px] text-white/35">{selected.count} messages</span>}
                    {selected.important && <span className="text-[#FCBF17] text-[10px]">★ Important</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <ActionBtn title={selected.important ? "Unstar" : "Star"} onClick={() => toggleImportant(selected)}>
                    <Star size={13} className={selected.important ? "fill-[#FCBF17] text-[#FCBF17]" : ""} />
                  </ActionBtn>
                  <ActionBtn title="Mark unread" onClick={() => markUnread(selected)}>
                    <Mail size={13} />
                  </ActionBtn>
                  {folder !== "archived" ? (
                    <ActionBtn title="Archive" onClick={() => archiveThread(selected)}>
                      <Archive size={13} />
                    </ActionBtn>
                  ) : (
                    <ActionBtn title="Unarchive" onClick={() => unarchiveThread(selected)}>
                      <MailOpen size={13} />
                    </ActionBtn>
                  )}
                  {folder !== "trash" ? (
                    <ActionBtn title="Delete" onClick={() => deleteThread(selected)} danger>
                      <Trash2 size={13} />
                    </ActionBtn>
                  ) : (
                    <ActionBtn title="Restore" onClick={() => restoreThread(selected)}>
                      <MailCheck size={13} />
                    </ActionBtn>
                  )}
                  <button onClick={() => setSelectedKey(null)} className="hidden lg:flex p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors ml-1">
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Sender strip */}
              <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: avatarColor(selected.name) }}>
                  {initials(selected.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">{selected.name}</p>
                  <a href={`mailto:${selected.email}`} className="text-[11px] text-khi-blue-soft hover:underline">{selected.email}</a>
                </div>
                <span className="ml-auto text-[10px] text-white/30 flex-shrink-0">
                  {new Date(selected.lastAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>

              {/* Timeline */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
                {loadingSent && (
                  <div className="text-[10px] text-white/25 text-center py-1">Loading history…</div>
                )}
                {threadItems.map((item, i) => {
                  if (item.kind === "sent") return (
                    <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.03 }}
                      className="rounded-xl bg-[#FCBF17]/[0.06] border border-[#FCBF17]/20 p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <SendIcon size={10} className="text-[#FCBF17]" />
                        <span className="text-[10px] font-semibold text-[#FCBF17]">Invitation sent</span>
                        <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${item.status === "sent" ? "bg-[#51FFD5]/10 text-[#51FFD5]" : "bg-white/10 text-white/40"}`}>
                          {item.status}
                        </span>
                        <span className="ml-auto text-[10px] text-white/25">{new Date(item.at).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}</span>
                      </div>
                      <p className="text-[11px] text-white/55 truncate">{item.subject}</p>
                    </motion.div>
                  );
                  if (item.kind === "in") return (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.03 }}
                      className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: avatarColor(item.name) }}>{initials(item.name)}</span>
                        <span className="text-[10px] font-semibold text-white/55">{item.name}</span>
                        <span className="text-[10px] text-white/25 ml-auto">{new Date(item.at).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}</span>
                      </div>
                      <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{item.text}</p>
                    </motion.div>
                  );
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.03 }}
                      className="ml-6 rounded-xl bg-khi-blue/[0.08] border border-khi-blue/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCheck size={11} className="text-[#51FFD5]" />
                        <span className="text-[10px] font-semibold text-[#51FFD5]">You</span>
                        <span className="text-[10px] text-white/25 ml-auto">{new Date(item.at).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}</span>
                      </div>
                      <p className="text-xs text-white/65 leading-relaxed whitespace-pre-wrap">{item.text}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Reply box */}
              {folder !== "trash" && (
                <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-khi-blue/40 transition-colors overflow-hidden">
                    <textarea ref={replyRef} value={replyText} onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${selected.name}…`} rows={3}
                      className="w-full bg-transparent px-4 pt-3 pb-2 text-sm text-white placeholder:text-white/25 outline-none resize-none leading-relaxed" />
                    <div className="flex items-center justify-between px-3 pb-2.5">
                      <span className="text-[10px] text-white/20">→ {selected.email}</span>
                      <AnimatePresence mode="wait">
                        {confirming ? (
                          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center gap-2">
                            <span className="text-[11px] text-white/50">Confirm send?</span>
                            <button onClick={() => setConfirming(false)} className="px-2.5 py-1 rounded-lg text-[11px] text-white/40 hover:text-white border border-white/10 hover:border-white/20 transition-colors">Cancel</button>
                            <motion.button whileTap={{ scale: 0.96 }} onClick={sendReply} disabled={sending}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold text-white bg-khi-blue hover:bg-khi-blue-bright transition-colors disabled:opacity-50">
                              {sending ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw size={10} /></motion.span> : <Send size={10} />}
                              {sending ? "Sending…" : "Send"}
                            </motion.button>
                          </motion.div>
                        ) : (
                          <motion.button key="trigger" whileTap={{ scale: 0.96 }}
                            onClick={() => { if (replyText.trim()) setConfirming(true); }}
                            disabled={!replyText.trim()}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-khi-blue/80 hover:bg-khi-blue text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <Reply size={10} />Reply
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="hidden lg:flex flex-col items-center justify-center h-full gap-3 text-white/15 p-12">
              <Inbox size={32} strokeWidth={1} />
              <p className="text-sm text-white/25">Select a conversation</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────

function ActionBtn({ children, onClick, title, danger }: {
  children: React.ReactNode; onClick: () => void; title: string; danger?: boolean;
}) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors ${danger ? "text-white/30 hover:text-red-400 hover:bg-red-500/10" : "text-white/30 hover:text-white hover:bg-white/[0.07]"}`}>
      {children}
    </button>
  );
}

function BulkBtn({ onClick, icon, label, danger }: { onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
        danger
          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
          : "border-white/15 text-white/60 hover:text-white hover:border-white/30"
      }`}>
      {icon}{label}
    </button>
  );
}

function ThreadRow({ thread, selected, selectionMode, checked, onSelect, onToggleImportant, onArchive, onDelete, folder }: {
  thread: Thread; selected: boolean; selectionMode: boolean; checked: boolean;
  onSelect: () => void; onToggleImportant: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void; onDelete: (e: React.MouseEvent) => void;
  folder: Folder;
}) {
  const isNew = thread.unread;
  return (
    <button onClick={onSelect}
      className={`group w-full text-left flex items-start gap-3 px-3 py-3 border-b border-white/[0.04] transition-colors duration-150 ${
        selected ? "bg-khi-blue/10 border-l-2 border-l-khi-blue" : checked ? "bg-khi-blue/[0.06]" : "hover:bg-white/[0.03]"
      }`}>
      {/* Checkbox / Avatar */}
      <div className="relative w-8 h-8 flex-shrink-0 mt-0.5">
        {selectionMode ? (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${checked ? "bg-khi-blue border-khi-blue" : "border-white/30 bg-white/[0.04]"}`}>
            {checked && <CheckSquare size={14} className="text-white" />}
          </div>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: avatarColor(thread.name) }}>
              {initials(thread.name)}
            </div>
            {isNew && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-khi-blue-bright border-2 border-[#070D1E]" />}
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-xs truncate ${isNew ? "font-bold text-white" : "font-medium text-white/70"}`}>{thread.name}</span>
            {thread.count > 1 && <span className="flex-shrink-0 text-[9px] font-bold text-white/40 bg-white/10 rounded-full px-1.5 leading-4">{thread.count}</span>}
            {thread.important && <Star size={9} className="flex-shrink-0 fill-[#FCBF17] text-[#FCBF17]" />}
          </div>
          <span className="text-[10px] text-white/30 flex-shrink-0">{timeAgo(thread.lastAt)}</span>
        </div>
        <p className={`text-[11px] truncate mb-0.5 ${isNew ? "text-white/80" : "text-white/45"}`}>{thread.subject}</p>
        <p className="text-[10px] text-white/25 truncate">{thread.latest.message.slice(0, 60)}{thread.latest.message.length > 60 ? "…" : ""}</p>
      </div>

      {/* Hover actions — hidden in selection mode */}
      {!selectionMode && (
        <div className="flex-shrink-0 flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onToggleImportant} title={thread.important ? "Unstar" : "Star"}
            className="p-1 rounded text-white/30 hover:text-[#FCBF17] transition-colors">
            <Star size={11} className={thread.important ? "fill-[#FCBF17] text-[#FCBF17]" : ""} />
          </button>
          {folder !== "trash" && folder !== "archived" && (
            <button onClick={onArchive} title="Archive" className="p-1 rounded text-white/30 hover:text-white/70 transition-colors">
              <Archive size={11} />
            </button>
          )}
          <button onClick={onDelete} title="Delete" className="p-1 rounded text-white/30 hover:text-red-400 transition-colors">
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </button>
  );
}
