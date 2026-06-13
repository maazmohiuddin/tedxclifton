/**
 * TEDxClifton — master email layout.
 * Pass variant:"vip" to get gold accents throughout.
 */

export interface EmailDetailRow {
  label: string;
  value: string;
}

export interface EmailCTAButton {
  label: string;
  url: string;
}

export interface KhinextEmailParams {
  preheader: string;
  eyebrow: string;
  headline: string;
  greeting?: string;
  body: string;
  details?: EmailDetailRow[];
  cta?: EmailCTAButton;
  signoff?: string;
  signature?: string;
  footerNote?: string;
  /** "vip" renders gold glows, eyebrow, accents and CTA. Default: "standard" (red). */
  variant?: "standard" | "vip";
}

const DEFAULTS = {
  signoff:      "See you in Karachi,",
  signature:    "The TEDxClifton Team",
  footerNote:   "You're receiving this because you interacted with TEDxClifton.",
  brandHomeUrl: "https://tedxclifton.com",
};

export function renderKhinextEmail(p: KhinextEmailParams): string {
  const vip = p.variant === "vip";

  // Colour palette
  const glowRgb1  = vip ? "201,148,10"  : "235,0,40";   // header glow inner
  const glowRgb2  = vip ? "201,148,10"  : "235,0,40";   // header glow outer
  const lightAccent = vip ? "#FFB800"   : "#FF8A9D";       // eyebrow, em, logo text
  const chipBg    = vip ? "#96700A"     : "#EB0028";        // brand chip + CTA bg
  const ctaBg     = vip ? "#96700A"     : "#EB0028";        // CTA button

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(p.eyebrow)} — TEDxClifton</title>
<style>
  body, table, td, p { margin:0; padding:0; }
  table, td { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { display:block; border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
  a { text-decoration:none; }
  a[data-accent], em[data-accent] {
    color:${lightAccent} !important;
    font-style:italic !important;
    font-weight:900 !important;
  }
  @media only screen and (max-width:620px){
    .kx-container { width:100% !important; max-width:100% !important; }
    .kx-px { padding-left:24px !important; padding-right:24px !important; }
    .kx-h1 { font-size:30px !important; line-height:1.08 !important; }
    .kx-btn { display:block !important; width:100% !important; box-sizing:border-box !important; }
  }
  @media (prefers-color-scheme: dark){
    .kx-light-bg { background:#0c1226 !important; }
    .kx-body-text { color:#cdd4e8 !important; }
    .kx-headline-dark { color:#FFFFFF !important; }
    .kx-divider { border-color:#1c2540 !important; }
    .kx-details-bg { background:#0c1226 !important; border-color:#2a3358 !important; }
    .kx-details-label { color:#8a93b3 !important; }
    .kx-details-value { color:#FFFFFF !important; }
    .kx-footer-bg { background:#0c1226 !important; color:#7a83a0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#000000;color:#0F1626;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#000000">${esc(p.preheader)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#000000">
<tr><td align="center" style="padding:40px 16px">
  <table role="presentation" class="kx-container" cellpadding="0" cellspacing="0" border="0" width="600"
         style="width:600px;max-width:600px;background:#FFFFFF;border-radius:18px;overflow:hidden;
                box-shadow:0 30px 80px rgba(0,0,0,.45)">

    <!-- Hero header -->
    <tr><td class="kx-px" style="
      background:#0A0204;
      background-image:
        radial-gradient(ellipse 60% 80% at 80% 0%,rgba(${glowRgb1},.48) 0%,rgba(10,2,4,0) 60%),
        radial-gradient(ellipse 60% 80% at 20% 100%,rgba(${glowRgb2},.30) 0%,rgba(10,2,4,0) 60%);
      padding:40px 44px 52px">
      ${renderBrandLockup(lightAccent, chipBg)}
      <div style="margin-top:28px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:${lightAccent}">${esc(p.eyebrow)}</div>
      <h1 class="kx-h1" style="margin:12px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:38px;line-height:1.04;letter-spacing:-0.03em;font-weight:900;color:#FFFFFF">${p.headline}</h1>
    </td></tr>

    <!-- Body -->
    <tr><td class="kx-px kx-light-bg kx-body-text" style="padding:40px 44px 8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#2A3245;background:#FFFFFF">
      ${p.greeting ? `<p style="margin:0 0 18px">${p.greeting}</p>` : ""}
      <div>${p.body}</div>

      ${p.details ? renderDetails(p.details) : ""}
      ${p.cta ? renderCTA(p.cta, ctaBg) : ""}

      <div class="kx-divider" style="margin-top:28px;padding-top:18px;border-top:1px solid #E4EAF6;font-size:13px;color:#6C7894">
        ${esc(p.signoff ?? DEFAULTS.signoff)}<br>
        <strong class="kx-headline-dark" style="color:#0A0204">${esc(p.signature ?? DEFAULTS.signature)}</strong><br>
        <span style="font-size:12px">An independently organized TED event · Clifton, Karachi</span>
      </div>
    </td></tr>

    <!-- Footer -->
    <tr><td class="kx-footer-bg" style="background:#F4F7FE;padding:22px 44px;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#6C7894;line-height:1.6">
      © 2026 TEDxClifton. An independently organized TED event.<br>
      <span style="color:#9AA4BD">IDEAS WORTH SPREADING</span>
    </td></tr>
  </table>

  <p style="margin:24px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:rgba(255,255,255,.32);max-width:600px">${esc(p.footerNote ?? DEFAULTS.footerNote)}</p>
</td></tr>
</table>
</body></html>`;
}

// ── partials ──────────────────────────────────────────────────

function renderBrandLockup(lightAccent: string, chipBg: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding-right:12px;vertical-align:middle">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="36" height="36" style="background:${chipBg};border-radius:10px">
          <tr><td align="center" valign="middle" style="height:36px;width:36px;color:#fff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:14px;line-height:1">TED<span style="color:#FFFFFF">x</span></td></tr>
        </table>
      </td>
      <td style="vertical-align:middle;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:-0.02em">TEDx<em style="color:${lightAccent};font-style:italic;font-weight:800">Clifton</em></td>
    </tr>
  </table>`;
}

function renderDetails(rows: EmailDetailRow[]): string {
  const trs = rows.map((r, i) => {
    const last = i === rows.length - 1;
    const border = last ? "" : "border-bottom:1px dashed #DEE6FA";
    return `<tr>
      <td class="kx-details-label" style="padding:6px 0;color:#6C7894;${border}">${esc(r.label)}</td>
      <td align="right" class="kx-details-value" style="padding:6px 0;color:#0A0204;font-weight:700;${border}">${esc(r.value)}</td>
    </tr>`;
  }).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="kx-details-bg" style="margin:24px 0;background:#F4F7FE;border:1px solid #DEE6FA;border-radius:12px">
    <tr><td style="padding:18px 22px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px">
        ${trs}
      </table>
    </td></tr>
  </table>`;
}

function renderCTA(cta: EmailCTAButton, bg: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px">
    <tr><td>
      <a href="${esc(cta.url)}" class="kx-btn"
         style="display:inline-block;background:${bg};color:#FFFFFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.01em;padding:14px 28px;border-radius:999px;text-decoration:none">${esc(cta.label)} →</a>
    </td></tr>
  </table>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Event Agenda block ────────────────────────────────────────

type SessionType = "registration" | "keynote" | "speaker" | "panel" | "activity" | "fireside" | "closing" | "networking" | "general";

interface AgendaRow {
  num: string;
  time: string;
  session: string;
  speaker?: string;
  role?: string;
  topic?: string;
  type: SessionType;
  accent?: "blue" | "gold" | "red" | "teal" | "orange" | null;
}

const AGENDA_ROWS: AgendaRow[] = [
  { num: "01", time: "9:00 – 10:00",  session: "Registration",                        type: "registration", accent: "blue" },
  { num: "02", time: "10:30 – 10:40", session: "Welcome Note / Opening Remarks",       speaker: "Syed Wajid Hussain Shah",              type: "general",   accent: "blue" },
  { num: "03", time: "10:45 – 10:55", session: "Inaugural Keynote",                    speaker: "Syed Abdul Qadir",                     type: "keynote",   accent: null   },
  { num: "04", time: "11:00 – 11:15", session: "Special Keynote",                      speaker: "Chief Guest Sardar M. Bux Khan Mahar", type: "keynote",   accent: "gold" },
  { num: "05", time: "11:20 – 11:30", session: "Keynote",                              speaker: "Mr. Munawar Mahesar",                  type: "keynote",   accent: "gold" },
  { num: "06", time: "11:35 – 11:45", session: "1st Speaker Session",                  speaker: "Raza Abbas",       role: "CTO Unilever Pakistan",         type: "speaker",  accent: "blue"   },
  { num: "07", time: "11:50 – 12:15", session: "1st Panel Discussion",   topic: "How AI is Reshaping Attention in the Digital Age",       type: "panel",    accent: "red"    },
  { num: "08", time: "12:20 – 12:35", session: "1st Activity",                                                                           type: "activity", accent: null     },
  { num: "09", time: "12:40 – 12:55", session: "1st Fireside Chat",      speaker: "Dr. Imran Batata",  role: "CDO & Director IT @ IOBM", type: "fireside", accent: "gold"   },
  { num: "10", time: "1:00 – 1:10",   session: "2nd Speaker",                          speaker: "Umair Nizam",      role: "Senior Vice Chairman P@sha",    type: "speaker",  accent: "blue"   },
  { num: "11", time: "1:15 – 1:25",   session: "3rd Speaker",                          speaker: "Khushnood Aftab",  role: "CEO Viper Technologies",         type: "speaker",  accent: "blue"   },
  { num: "12", time: "1:30 – 1:55",   session: "2nd Panel Discussion",  topic: "How AI is Powering a Nation's Backbone",                  type: "panel",    accent: "teal"   },
  { num: "13", time: "2:00 – 2:15",   session: "Activity 2",                                                                              type: "activity", accent: null     },
  { num: "14", time: "2:20 – 2:30",   session: "4th Speaker",                          speaker: "Huma Yahya",       role: "CEO ELFA (EV Technologies)",    type: "speaker",  accent: "blue"   },
  { num: "15", time: "2:35 – 2:50",   session: "2nd Fireside Chat",     speaker: "Saif Ali",          role: "Founder [ Stealth ]",            type: "fireside", accent: "gold"   },
  { num: "16", time: "2:55 – 3:05",   session: "5th Speaker",                          speaker: "Saad Zuberi",      role: "CEO Luckyone",                   type: "speaker",  accent: "blue"   },
  { num: "17", time: "3:10 – 3:20",   session: "6th Speaker",                          speaker: "Ansar Muhammad",   role: "VP Engineering 10Pearls",        type: "speaker",  accent: "blue"   },
  { num: "18", time: "3:25 – 3:50",   session: "3rd Panel Discussion",  topic: "AI-Powered Pakistan: Building the Next Generation",        type: "panel",    accent: "orange" },
  { num: "19", time: "4:00 – 4:15",   session: "Closing & Thank You Note",                                                                type: "closing",  accent: null     },
  { num: "20", time: "4:20 – 5:00",   session: "Shield Distribution / Group Photo / Networking",                                          type: "networking", accent: null   },
];

const ACCENT_COLOR: Record<string, string> = {
  blue: "#EB0028", gold: "#FCBF17", red: "#FF1F44", teal: "#00EAEE", orange: "#FF4D00",
};

// Type badge: label + bg + text colour
const TYPE_BADGE: Partial<Record<SessionType, { label: string; bg: string; color: string }>> = {
  keynote:  { label: "KEYNOTE",  bg: "#96700A", color: "#FFF" },
  panel:    { label: "PANEL",    bg: "inherit", color: "#FFF" }, // colour overridden per row accent
  fireside: { label: "FIRESIDE", bg: "#96700A", color: "#000" },
  speaker:  { label: "SPEAKER",  bg: "#5e1a24", color: "#FF8A9D" },
};

// Panel icon filenames keyed by accent colour
const PANEL_ICON_FILE: Record<string, string> = {
  red:    "Lifestyle.png",
  teal:   "SmartCities.png",
  orange: "Future.png",
};

function renderSessionBadge(row: AgendaRow, siteUrl: string): string {
  const def = TYPE_BADGE[row.type];
  if (!def) return "";

  // Panel rows: branded icon PNG (includes coloured background)
  if (row.type === "panel" && row.accent) {
    const file = PANEL_ICON_FILE[row.accent];
    if (file) {
      return `<img src="${siteUrl}/brand/${file}" width="26" height="26" alt="Panel" style="display:inline-block;vertical-align:middle;margin-right:8px;border-radius:5px;border:0" />`;
    }
  }

  // Fireside rows: TEDxClifton brand icon
  if (row.type === "fireside") {
    return `<img src="${siteUrl}/brand/Firechat.png" width="28" height="28" alt="Fireside" style="display:inline-block;vertical-align:middle;margin-right:8px;border-radius:5px;border:0" />`;
  }

  const bg = row.type === "panel" && row.accent ? ACCENT_COLOR[row.accent] : def.bg;
  return `<span style="display:inline-block;background:${bg};color:${def.color};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:8px;font-weight:700;letter-spacing:.1em;padding:2px 5px;border-radius:3px;vertical-align:middle;margin-right:6px;margin-top:-1px">${def.label}</span>`;
}

export function renderAgendaBlock(): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://tedxclifton.com").replace(/\/$/, "");
  const logoUrl = `${siteUrl}/brand/logo-mark.png`;

  const rows = AGENDA_ROWS.map((r, i) => {
    const bg     = i % 2 === 0 ? "#0E1628" : "#080E1C";
    const accent = r.accent ? ACCENT_COLOR[r.accent] : "transparent";
    const numColor = r.accent ? ACCENT_COLOR[r.accent] : "rgba(235,0,40,0.35)";
    const badge  = renderSessionBadge(r, siteUrl);

    // Session name line
    const sessionLine = badge
      ? `${badge}<span style="font-size:13px;font-weight:700;color:#f0f4ff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;vertical-align:middle">${esc(r.session)}</span>`
      : `<span style="font-size:13px;font-weight:700;color:#f0f4ff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${esc(r.session)}</span>`;

    // Topic line (panel discussions)
    const topicLine = r.topic
      ? `<br><span style="font-size:11px;font-style:italic;font-weight:600;color:${accent !== "transparent" ? accent : "#FF8A9D"};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${esc(r.topic)}</span>`
      : "";

    // Speaker/role line
    const speakerLine = r.speaker
      ? `<br><span style="font-size:11px;font-weight:700;font-style:italic;color:#EB0028;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${esc(r.speaker)}</span>${r.role ? `&nbsp;<span style="font-size:9px;color:#555;letter-spacing:.08em;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${esc(r.role)}</span>` : ""}`
      : "";

    return `<tr>
      <td style="width:4px;background:${accent};padding:0;min-width:4px"></td>
      <td style="background:${bg};padding:10px 10px 10px 14px;border-bottom:1px solid #1a2236;white-space:nowrap;vertical-align:top">
        <span style="font-size:10px;font-weight:700;color:${numColor};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;display:block">${esc(r.num)}</span>
        <span style="font-size:12px;font-weight:600;color:#cdd4e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${esc(r.time)}</span>
      </td>
      <td style="background:${bg};padding:10px 14px;border-bottom:1px solid #1a2236;border-left:1px solid #1a2236;vertical-align:top">
        ${sessionLine}${topicLine}${speakerLine}
      </td>
    </tr>`;
  }).join("");

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin:32px 0 8px;border-radius:14px;overflow:hidden;border:1px solid #1a2236;background:#080E1C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <!-- Header -->
  <tr>
    <td colspan="3" style="background:#0A0204;padding:18px 18px 14px;border-bottom:2px solid #EB0028">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="vertical-align:middle">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;padding-right:10px">
                  <img src="${logoUrl}" alt="TEDxClifton" width="36" height="36" style="display:block;border-radius:8px;border:0" />
                </td>
                <td style="vertical-align:middle">
                  <span style="font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.02em">TEDx<em style="color:#FF8A9D;font-style:italic;font-weight:800">Clifton</em></span>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" style="vertical-align:middle">
            <span style="font-size:20px;font-weight:900;color:#FFFFFF;letter-spacing:-0.03em">Event <em style="color:#EB0028;font-style:italic">Schedule</em></span><br>
            <span style="font-size:10px;font-weight:600;color:#7a8ab0;letter-spacing:.16em;text-transform:uppercase">Clifton, Karachi</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Col headers -->
  <tr>
    <td style="width:4px;background:#EB0028;padding:0"></td>
    <td style="background:#0c1530;padding:7px 10px 7px 14px;border-bottom:1px solid #1a2236">
      <span style="font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#EB0028">TIME</span>
    </td>
    <td style="background:#0c1530;padding:7px 14px;border-bottom:1px solid #1a2236;border-left:1px solid #1a2236">
      <span style="font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#EB0028">SESSION</span>
    </td>
  </tr>
  ${rows}
  <!-- Footer bar -->
  <tr>
    <td colspan="3" style="background:#EB0028;padding:6px 18px;text-align:center">
      <span style="font-size:10px;font-weight:700;color:#FFFFFF;letter-spacing:.12em;text-transform:uppercase">TEDxClifton &nbsp;·&nbsp; Ideas Worth Spreading</span>
    </td>
  </tr>
</table>`;
}
