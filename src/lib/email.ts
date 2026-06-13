/**
 * Transactional email via nodemailer SMTP.
 * Server-only — never import from a client component.
 */
import nodemailer from "nodemailer";
import { renderKhinextEmail, type KhinextEmailParams } from "./email/layout";

function createTransport() {
  const host = process.env.SMTP_HOST ?? "mail.tedxclifton.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER ?? "hello@tedxclifton.com";
  const pass = process.env.SMTP_PASS;
  if (!pass) throw new Error("SMTP_PASS is not configured.");
  return nodemailer.createTransport({
    host, port, secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

const FROM_ADDRESS = process.env.SMTP_USER ?? "hello@tedxclifton.com";
const FROM = `TEDxClifton <${FROM_ADDRESS}>`;

export interface SendKhinextEmailParams extends KhinextEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  /** RFC 5322 threading headers — make replies thread in the recipient's client. */
  inReplyTo?: string;
  references?: string | string[];
}

export async function sendKhinextEmail(p: SendKhinextEmailParams) {
  const transport = createTransport();
  const html = renderKhinextEmail(p);
  const text = p.text ?? stripHtml(p.body);
  const to = Array.isArray(p.to) ? p.to.join(", ") : p.to;
  const info = await transport.sendMail({
    from: FROM, to, replyTo: FROM_ADDRESS, subject: p.subject, html, text,
    inReplyTo: p.inReplyTo,
    references: p.references,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────
// Registration confirmation
// ─────────────────────────────────────────────────────────────

interface RegistrationConfirmationParams {
  to: string;
  fullName: string;
  registrationId: string;
  track: string;
  role: string;
  resend?: boolean;
}

export async function sendRegistrationConfirmation(p: RegistrationConfirmationParams) {
  const shortId = `R-${p.registrationId.slice(0, 8).toUpperCase()}`;
  return sendKhinextEmail({
    to: p.to,
    subject: `You're confirmed for TEDxClifton — ${p.track}`,
    preheader: `${p.resend ? "[Resend] " : ""}Your seat at TEDxClifton is confirmed. Clifton, Karachi.`,
    eyebrow: "Registration · Confirmed",
    headline: `Your seat is <em data-accent>confirmed.</em>`,
    greeting: `Hi <strong style="color:#0A0204">${escapeHtml(p.fullName)}</strong>,`,
    body: `
      <p style="margin:0 0 18px">You're officially registered for <strong style="color:#0A0204">TEDxClifton</strong> — an independently organized TED event built around Ideas Worth Spreading. We can't wait to host you in Clifton, Karachi.</p>
      <p style="margin:0 0 18px"><strong style="color:#0A0204">What's next?</strong> You'll receive a venue + programme update closer to the event. If your plans change, reply to this email and we'll sort it out.</p>
    `,
    details: [
      { label: "Registration ID", value: shortId },
      { label: "Attendee",        value: p.fullName },
      { label: "Track",           value: p.track },
      { label: "Role",            value: p.role },
      { label: "Event",           value: "TEDxClifton · Clifton, Karachi" },
    ],
    footerNote: "You're receiving this because you registered for TEDxClifton.",
  });
}

// ─────────────────────────────────────────────────────────────
// Speaker submission decision email
// ─────────────────────────────────────────────────────────────

interface SubmissionDecisionParams {
  to: string;
  fullName: string;
  projectName: string;
  decision: "approved" | "rejected";
  note?: string | null;
}

export async function sendSubmissionDecision(p: SubmissionDecisionParams) {
  const approved = p.decision === "approved";
  return sendKhinextEmail({
    to: p.to,
    subject: approved
      ? `Your talk submission is approved — TEDxClifton`
      : `Update on your talk submission — TEDxClifton`,
    preheader: approved
      ? `Congratulations! "${p.projectName}" has been selected for the TEDxClifton stage.`
      : `We reviewed your submission "${p.projectName}" for TEDxClifton.`,
    eyebrow: approved ? "Speakers · Approved" : "Speakers · Update",
    headline: approved
      ? `Your talk is <em data-accent>approved.</em>`
      : `Submission <em data-accent>reviewed.</em>`,
    greeting: `Hi <strong style="color:#0A0204">${escapeHtml(p.fullName)}</strong>,`,
    body: approved
      ? `
        <p style="margin:0 0 18px">Congratulations — your talk <strong style="color:#0A0204">"${escapeHtml(p.projectName)}"</strong> has been selected for the <strong style="color:#0A0204">TEDxClifton</strong> stage!</p>
        <p style="margin:0 0 18px">Our team will be in touch with next steps, including speaker prep, rehearsal details and your slot in the programme. Get ready to share your idea with the room.</p>
        ${p.note ? `<p style="margin:0 0 18px"><strong style="color:#0A0204">Note from the team:</strong> ${escapeHtml(p.note)}</p>` : ""}
      `
      : `
        <p style="margin:0 0 18px">Thank you for submitting <strong style="color:#0A0204">"${escapeHtml(p.projectName)}"</strong> to TEDxClifton. After review, we're unable to include this talk in the current programme.</p>
        <p style="margin:0 0 18px">We encourage you to keep developing your idea — TEDxClifton is about Ideas Worth Spreading. Stay connected for future opportunities.</p>
        ${p.note ? `<p style="margin:0 0 18px"><strong style="color:#0A0204">Feedback:</strong> ${escapeHtml(p.note)}</p>` : ""}
      `,
    details: [
      { label: "Talk",     value: p.projectName },
      { label: "Decision", value: approved ? "✓ Approved" : "✗ Not selected" },
      { label: "Event",    value: "TEDxClifton · Clifton, Karachi" },
    ],
    footerNote: "You're receiving this because you submitted a talk to TEDxClifton.",
  });
}

// ─────────────────────────────────────────────────────────────
// Contact form — admin notification + reply
// ─────────────────────────────────────────────────────────────

interface ContactNotificationParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  messageId: string;
}

export async function sendContactNotification(p: ContactNotificationParams) {
  return sendKhinextEmail({
    to: FROM_ADDRESS,
    subject: `New query: ${p.subject}`,
    preheader: `New contact message from ${p.name} <${p.email}>`,
    eyebrow: "Contact · New Message",
    headline: `New query <em data-accent>received.</em>`,
    body: `
      <p style="margin:0 0 18px">A new contact message has been submitted via the TEDxClifton website.</p>
      <p style="margin:0 0 6px"><strong style="color:#0A0204">From:</strong> ${escapeHtml(p.name)} &lt;${escapeHtml(p.email)}&gt;</p>
      <p style="margin:0 0 18px"><strong style="color:#0A0204">Subject:</strong> ${escapeHtml(p.subject)}</p>
      <blockquote style="margin:0 0 18px;padding:14px 18px;border-left:3px solid #EB0028;background:rgba(235,0,40,0.06);border-radius:0 8px 8px 0;color:#333;font-style:italic;">
        ${escapeHtml(p.message).replace(/\n/g, "<br>")}
      </blockquote>
    `,
    details: [{ label: "Message ID", value: `C-${p.messageId.slice(0, 8).toUpperCase()}` }],
    footerNote: "Reply directly from the Admin Inbox at tedxclifton.com/admin",
  });
}

interface ContactReplyParams {
  to: string;
  toName: string;
  subject: string;
  originalMessage: string;
  replyText: string;
  /** Message-ID of the message being replied to (threads in recipient client). */
  inReplyTo?: string;
  references?: string[];
}

export async function sendContactReply(p: ContactReplyParams) {
  // Don't double-prefix "Re:" when the inbound subject already carries it.
  const subject = /^re:/i.test(p.subject.trim()) ? p.subject.trim() : `Re: ${p.subject}`;
  return sendKhinextEmail({
    to: p.to,
    inReplyTo: p.inReplyTo,
    references: p.references && p.references.length ? p.references : undefined,
    subject,
    preheader: `A reply from the TEDxClifton team regarding your query.`,
    eyebrow: "TEDxClifton · Reply",
    headline: `We've <em data-accent>replied.</em>`,
    greeting: `Hi <strong style="color:#0A0204">${escapeHtml(p.toName)}</strong>,`,
    body: `
      <p style="margin:0 0 18px">${escapeHtml(p.replyText).replace(/\n/g, "<br>")}</p>
      <p style="margin:18px 0 6px;font-size:12px;color:#888;border-top:1px solid #eee;padding-top:14px;">
        <strong>Your original message:</strong>
      </p>
      <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #ccc;background:#f9f9f9;border-radius:0 6px 6px 0;color:#666;font-size:13px;font-style:italic;">
        ${escapeHtml(p.originalMessage).replace(/\n/g, "<br>")}
      </blockquote>
    `,
    details: [],
    footerNote: "You're receiving this reply because you contacted the TEDxClifton team.",
  });
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
