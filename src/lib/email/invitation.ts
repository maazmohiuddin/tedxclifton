/**
 * "You Are Invited" — TEDxClifton invitation email.
 * Used for bulk invitation sends from the admin panel.
 */
import { renderKhinextEmail, renderAgendaBlock, type KhinextEmailParams } from "./layout";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tedxclifton.com").replace(/\/$/, "");

export const INVITATION_SUBJECT     = "You're Invited — TEDxClifton · Clifton, Karachi";
export const VIP_INVITATION_SUBJECT = "Your VIP Invitation — TEDxClifton · Clifton, Karachi";
export const AGENDA_SUBJECT         = "The Agenda is Live — TEDxClifton · Clifton, Karachi";

/** Default CTA: standard card generator (no VIP access) */
export const DEFAULT_CTA_URL = `${SITE_URL}/card-generator`;

export const VIP_CARD_BODY =
  `As a personally selected VIP invitee, you have been given exclusive early access to generate your own personalised VIP Delegate card for TEDxClifton. Your access link is unique to you and valid for 48 hours — use the button below to create and download your card.`;

export const STANDARD_BODY = `
  <p style="margin:0 0 18px">We would like to personally invite you to <strong style="color:#0A0204">TEDxClifton</strong> — an independently organized TED event, bringing together the country's brightest minds and most compelling ideas worth spreading.</p>
  <p style="margin:0 0 18px">This is a curated gathering of <strong style="color:#0A0204">thinkers, makers, storytellers, and changemakers</strong>. Across a day of talks — from science to art, technology to society — TEDxClifton is where ideas become movements.</p>
  <p style="margin:0 0 18px">Your presence would make it exceptional. We've reserved a spot for you — create your personalised attendance card and share it with the world.</p>
`;

// ── Standard (normal) invitation ──────────────────────────────

export const INVITATION_BODY_PARAMS: KhinextEmailParams = {
  variant: "standard",
  preheader: "You're invited to TEDxClifton — an independently organized TED event. Clifton, Karachi, 7 June 2026.",
  eyebrow: "Exclusive · Invitation",
  headline: `You are <em data-accent>invited.</em>`,
  body: STANDARD_BODY,
  details: [
    { label: "Event",    value: "TEDxClifton" },
    { label: "Date",     value: "Sunday, 7 June 2026" },
    { label: "Location", value: "Clifton, Karachi" },
    { label: "Format",   value: "In-Person · Talks" },
    { label: "Theme",    value: "Ideas Worth Spreading" },
  ],
  cta: {
    label: "Create Your Attendance Card",
    url: DEFAULT_CTA_URL,
  },
  signoff: "With excitement,",
  signature: "The TEDxClifton Team",
  footerNote: "You're receiving this invitation because you were personally selected to attend TEDxClifton.",
};

// ── VIP invitation ─────────────────────────────────────────────

export const VIP_INVITATION_BODY_PARAMS: KhinextEmailParams = {
  variant: "vip",
  preheader: "You've been selected as a VIP Delegate for TEDxClifton. Your exclusive access link awaits.",
  eyebrow: "VIP · Exclusive Access",
  headline: `You are <em data-accent>VIP.</em>`,
  body: `<p style="margin:0 0 18px">${VIP_CARD_BODY}</p>`,
  details: [
    { label: "Event",    value: "TEDxClifton" },
    { label: "Date",     value: "Sunday, 7 June 2026" },
    { label: "Location", value: "Clifton, Karachi" },
    { label: "Access",   value: "VIP Delegate · 48-hour link" },
  ],
  cta: {
    label: "Create Your VIP Card",
    url: DEFAULT_CTA_URL, // overridden per-recipient in send route
  },
  signoff: "With honour,",
  signature: "The TEDxClifton Team",
  footerNote: "This VIP invitation was personally sent to you. Your access link is unique and expires in 48 hours.",
};

// ── Builder / renderer ─────────────────────────────────────────

export interface CustomInvitationParams {
  subject?: string;
  headline?: string;
  bodyText?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  isVip?: boolean;
  includeAgenda?: boolean;
}

const SITE_URL_INV = (process.env.NEXT_PUBLIC_SITE_URL || "https://tedxclifton.com").replace(/\/$/, "");

export function buildInvitationParams(custom?: CustomInvitationParams): KhinextEmailParams {
  const isVip = custom?.isVip === true;
  const base = isVip ? VIP_INVITATION_BODY_PARAMS : INVITATION_BODY_PARAMS;

  const mainBody = custom?.bodyText
    ? `<p style="margin:0 0 18px">${custom.bodyText}</p>`
    : base.body;

  const agendaSuffix = custom?.includeAgenda ? renderAgendaBlock() : "";

  // When agenda is included and no custom CTA, switch to a registration CTA
  const agendaCtaLabel = "Haven't registered yet? Register here";
  const agendaCtaUrl   = `${SITE_URL_INV}/register`;

  const ctaLabel = custom?.ctaLabel
    ?? (custom?.includeAgenda ? agendaCtaLabel : base.cta!.label);
  const ctaUrl = custom?.ctaUrl
    ?? (custom?.includeAgenda ? agendaCtaUrl : base.cta!.url);

  return {
    ...base,
    headline: custom?.headline
      ? (custom.headline.includes("data-accent")
          ? custom.headline
          : `<em data-accent>${custom.headline}</em>`)
      : base.headline,
    body: mainBody + agendaSuffix,
    cta: { label: ctaLabel, url: ctaUrl },
  };
}

export function renderInvitationEmail(custom?: CustomInvitationParams): string {
  return renderKhinextEmail(buildInvitationParams(custom));
}
