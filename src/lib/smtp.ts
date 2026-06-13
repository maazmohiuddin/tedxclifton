/**
 * Nodemailer SMTP transport — mail.tedxclifton.com:465 SSL.
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

export interface SmtpEmailParams extends KhinextEmailParams {
  to: string;
  subject: string;
  text?: string;
}

/** Send a single email rendered from template params. */
export async function sendSmtpEmail(p: SmtpEmailParams) {
  const transport = createTransport();
  const html = renderKhinextEmail(p);
  const text = p.text ?? stripHtml(p.body);
  return transport.sendMail({ from: FROM, to: p.to, replyTo: FROM_ADDRESS, subject: p.subject, html, text });
}

/** Send a pre-rendered HTML email. Returns the SMTP messageId. */
export async function sendRawEmail(p: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ messageId: string }> {
  const transport = createTransport();
  const info = await transport.sendMail({
    from: FROM, to: p.to, replyTo: FROM_ADDRESS,
    subject: p.subject, html: p.html, text: p.text,
  });
  return { messageId: info.messageId };
}

/** Legacy bulk sender (no per-recipient tracking). Kept for compatibility. */
export async function sendSmtpEmailsBulk(
  recipients: string[],
  params: Omit<SmtpEmailParams, "to">
): Promise<{ sent: string[]; failed: { email: string; error: string }[] }> {
  const transport = createTransport();
  const html = renderKhinextEmail(params);
  const text = params.text ?? stripHtml(params.body);
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  for (const to of recipients) {
    try {
      await transport.sendMail({ from: FROM, to, replyTo: FROM_ADDRESS, subject: params.subject, html, text });
      sent.push(to);
    } catch (err) {
      failed.push({ email: to, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { sent, failed };
}

/** Injects a 1×1 tracking pixel just before </body>. */
export function injectTrackingPixel(html: string, pixelUrl: string): string {
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;overflow:hidden">`;
  return html.includes("</body>") ? html.replace("</body>", `${pixel}</body>`) : html + pixel;
}

/** Plain-text fallback. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
