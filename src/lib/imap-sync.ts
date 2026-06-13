/**
 * IMAP sync helper — fetches emails from the configured mailbox and saves
 * unseen ones to the contact_messages table.
 *
 * Source is configurable so we can read from wherever mail reliably lands:
 *   • Default: the cPanel mailbox (mail.tedxclifton.com) via the SMTP_* creds.
 *   • Recommended: Gmail (imap.gmail.com) via dedicated IMAP_* creds + an
 *     App Password. Gmail never deletes on read and keeps full history, so
 *     it's immune to the POP3-fetch-and-delete race that empties a cPanel
 *     INBOX when Gmail is also importing from it.
 *
 * Env vars (IMAP_* override SMTP_*; folder + port have sane defaults):
 *   IMAP_HOST   (fallback SMTP_HOST → "mail.tedxclifton.com")
 *   IMAP_PORT   (default 993)
 *   IMAP_USER   (fallback SMTP_USER → "hello@tedxclifton.com")
 *   IMAP_PASS   (fallback SMTP_PASS)
 *   IMAP_FOLDER (default "INBOX"; Gmail tip: "[Gmail]/All Mail" for everything)
 *
 * Two-pass strategy:
 *   1. Fetch lightweight envelopes for the window to discover Message-IDs.
 *   2. Fetch full source ONLY for messages we haven't stored yet.
 *
 * Server-only.
 */
import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";
import { createServiceClient } from "@/lib/supabase/server";
import { Readable } from "stream";

export interface SyncDiagnostics {
  host: string;
  folder: string;
  totalInFolder: number;
  inWindow: number;
  newFound: number;
  notForUs?: number;
}

export interface SyncResult {
  imported: number;
  skipped: number;
  error?: string;
  diag?: SyncDiagnostics;
}

function stripHtml(html: string) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Collect every recipient address from To/Cc/Bcc + delivery headers, lowercased. */
function collectRecipients(parsed: ParsedMail): Set<string> {
  const out = new Set<string>();
  const add = (addr?: string) => { if (addr) out.add(addr.toLowerCase()); };

  for (const field of [parsed.to, parsed.cc, parsed.bcc]) {
    const list = Array.isArray(field) ? field : field ? [field] : [];
    for (const grp of list) for (const a of grp.value) add(a.address);
  }

  // Delivery-trace headers survive Gmail's POP3 import and reliably carry the
  // address the message was actually delivered to (e.g. hello@tedxclifton.com).
  for (const key of ["delivered-to", "x-delivered-to", "x-original-to", "envelope-to"]) {
    const raw = parsed.headers.get(key);
    const vals = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
    for (const v of vals) {
      const m = String(v).match(/[^\s<>@]+@[^\s<>@]+/g);
      if (m) m.forEach(add);
    }
  }
  return out;
}

export async function syncInboxEmails(): Promise<SyncResult> {
  // IMAP creds fall back to the SMTP ones so existing setups keep working.
  const host = process.env.IMAP_HOST ?? process.env.SMTP_HOST ?? "mail.tedxclifton.com";
  const port = Number(process.env.IMAP_PORT ?? 993);
  const user = process.env.IMAP_USER ?? process.env.SMTP_USER ?? "hello@tedxclifton.com";
  const pass = process.env.IMAP_PASS ?? process.env.SMTP_PASS;
  const folder = process.env.IMAP_FOLDER ?? "INBOX";

  if (!pass) return { imported: 0, skipped: 0, error: "IMAP_PASS / SMTP_PASS not configured" };

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    logger: false,
  });

  const svc = createServiceClient();

  // The mailbox we actually care about. When reading a shared/personal Gmail
  // inbox (where hello@tedxclifton.com is POP3-imported alongside personal mail),
  // we ONLY ingest messages addressed to these. Override/disable via
  // IMAP_FILTER_TO ("" or "off" turns the filter off).
  const filterRaw = process.env.IMAP_FILTER_TO ?? process.env.SMTP_USER ?? "hello@tedxclifton.com";
  const filterDisabled = filterRaw.trim() === "" || filterRaw.trim().toLowerCase() === "off";
  const filterTo = new Set(
    filterRaw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
  );

  // Addresses that represent "us" — never ingest our own outbound copies
  // (relevant when reading a folder like Gmail's "All Mail" that includes Sent).
  const ownAddresses = new Set(
    [user, process.env.SMTP_USER ?? "hello@tedxclifton.com"].map(a => a.toLowerCase()),
  );

  let imported = 0;
  let skipped = 0;
  const diag: SyncDiagnostics = { host, folder, totalInFolder: 0, inWindow: 0, newFound: 0, notForUs: 0 };

  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    try {
      // How many messages does the folder hold in total? (diagnostic signal)
      try {
        const status = await client.status(folder, { messages: true });
        diag.totalInFolder = status.messages ?? 0;
      } catch { /* some servers disallow STATUS on the selected box; ignore */ }

      // Primary: messages from the last 30 days.
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let uids = await client.search({ since }, { uid: true });
      let uidArray = Array.isArray(uids) ? uids : [];

      // Fallback: if a date-based search returns nothing but the folder is
      // clearly non-empty (some servers' SINCE search is unreliable), grab the
      // most recent messages by sequence instead.
      if (!uidArray.length && diag.totalInFolder > 0) {
        const mbox = client.mailbox;
        const total = typeof mbox === "object" && mbox ? mbox.exists : 0;
        if (total > 0) {
          const start = Math.max(1, total - 299);
          uids = await client.search({ seq: `${start}:*` }, { uid: true });
          uidArray = Array.isArray(uids) ? uids : [];
        }
      }

      if (!uidArray.length) return { imported: 0, skipped: 0, diag };

      // Scan the most recent slice of the window.
      const windowUids = uidArray.slice(-300);
      diag.inWindow = windowUids.length;

      // ── Pass 1: envelopes only → find which messages are new ──
      const candidates: { uid: number; messageId: string }[] = [];
      for await (const env of client.fetch(windowUids, { envelope: true }, { uid: true })) {
        const messageId = env.envelope?.messageId ?? `imap-uid-${env.uid}`;
        candidates.push({ uid: env.uid, messageId });
      }

      if (!candidates.length) return { imported: 0, skipped: 0, diag };

      // Which of these Message-IDs do we already have?
      const ids = candidates.map(c => c.messageId);
      const { data: existingRows } = await svc
        .from("contact_messages")
        .select("imap_message_id")
        .in("imap_message_id", ids);

      const known = new Set((existingRows ?? []).map(r => r.imap_message_id));
      const newUids = candidates.filter(c => !known.has(c.messageId)).map(c => c.uid);
      diag.newFound = newUids.length;
      skipped += candidates.length - newUids.length;

      if (!newUids.length) return { imported, skipped, diag };

      // ── Pass 2: full source for new messages only → parse + insert ──
      for await (const msg of client.fetch(newUids, { source: true }, { uid: true })) {
        try {
          if (!msg.source) { skipped++; continue; }

          const parsed: ParsedMail = await simpleParser(Readable.from(msg.source));
          const messageId = parsed.messageId ?? `imap-uid-${msg.uid}`;

          const fromAddr = parsed.from?.value[0];
          const name = fromAddr?.name?.trim() || fromAddr?.address || "Unknown";
          const email = fromAddr?.address?.toLowerCase() || "";

          // Never ingest our own outbound copies.
          if (ownAddresses.has(email)) { skipped++; continue; }

          // Only ingest mail actually addressed to hello@tedxclifton.com — this is
          // what keeps personal mail out when reading a shared Gmail inbox.
          if (!filterDisabled) {
            const recipients = collectRecipients(parsed);
            const forUs = Array.from(filterTo).some(addr => recipients.has(addr));
            if (!forUs) { skipped++; diag.notForUs = (diag.notForUs ?? 0) + 1; continue; }
          }

          const htmlContent = typeof parsed.html === "string" ? parsed.html : "";
          const body = parsed.text?.trim() || stripHtml(htmlContent) || "(no body)";
          const subject = parsed.subject?.trim() || "(no subject)";

          const { error: insertErr } = await svc.from("contact_messages").insert({
            name,
            email,
            subject,
            message: body,
            source: "email",
            imap_message_id: messageId,
            created_at: parsed.date?.toISOString() ?? new Date().toISOString(),
          });

          if (insertErr) { skipped++; continue; }
          imported++;
        } catch {
          skipped++;
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (e) {
    let message = e instanceof Error ? e.message : String(e);
    if (/ENOTFOUND|EAI_AGAIN/i.test(message)) {
      message += ` — the server can't resolve "${host}". This host is unreachable from where the app runs; point IMAP_HOST at a mailbox the deployment can reach (e.g. mail.tedxclifton.com).`;
    }
    return { imported, skipped, error: message, diag };
  }

  return { imported, skipped, diag };
}
