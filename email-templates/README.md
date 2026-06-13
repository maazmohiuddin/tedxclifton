# TEDxClifton — email templates

One brand-consistent shell that every transactional email inherits. All
emails share the same dark-ink header, blue-glow gradient, italic accent,
detail box, and grey footer chip — only the copy changes.

## Files

| File | Use it for |
|---|---|
| `khinext-standard.html` | Paste into **Resend → Templates → Create Template**. Has `{{handlebars}}` placeholders. |
| `example-registration-confirmation.html` | Static, fully-filled-in HTML you can drop into any email previewer or send as a test. |
| `../src/lib/email/layout.ts` | The TypeScript layout used by the app. All in-app emails go through this. |
| `../src/lib/email.ts` | High-level senders: `sendRegistrationConfirmation`, `sendKhinextEmail` (generic). |

## Approach #1 — send from the app (recommended)

In code, use the generic helper. The shell takes care of branding:

```ts
import { sendKhinextEmail } from "@/lib/email";

await sendKhinextEmail({
  to: "alice@example.com",
  subject: "TEDxClifton — venue & agenda update",
  preheader: "Hall A, doors 09:00. Full agenda inside.",
  eyebrow: "Venue · Agenda",
  headline: `The plan is <em data-accent>set.</em>`,
  greeting: `Hi <strong>Alice</strong>,`,
  body: `
    <p>Here's everything you need for Saturday.</p>
    <p>Arrive any time after 09:00. Coffee is on us.</p>
  `,
  details: [
    { label: "Date",  value: "Sat · 7 June 2026" },
    { label: "Venue", value: "Karachi Expo Centre · Hall A" },
    { label: "Doors", value: "09:00 PKT" },
  ],
  cta: { label: "Open the agenda", url: "https://khinext.vercel.app/ai-expo" },
  footerNote: "You're receiving this because you registered for TEDxClifton.",
});
```

That's it. The branded chrome wraps your content automatically.

## Approach #2 — manage templates in the Resend dashboard

1. Go to <https://resend.com/templates> → **Create template**
2. Name it `khinext-standard`
3. Paste the contents of `khinext-standard.html`
4. Save. Now you can send via API with `template: "khinext-standard"` and a `data: {...}` payload.

Available variables (all optional except the first 4):

| Name | Required | Notes |
|---|---|---|
| `preheader` | yes | <= 90 chars; hidden inbox preview line |
| `eyebrow` | yes | small all-caps label, e.g. `Registration · Confirmed` |
| `headline` | yes | the H1. Wrap a word with `<em data-accent>…</em>` for the italic blue accent |
| `body_html` | yes | main paragraph(s); HTML allowed |
| `greeting` | no | `Hi <strong>Alice</strong>,` |
| `details` | no | array of `{ label, value }` — renders the dotted info card |
| `cta_label` + `cta_url` | no | renders the pill button if both present |
| `signoff` | no | default: "See you in Karachi," |
| `signature` | no | default: "The TEDxClifton Team" |
| `footer_note` | no | small grey line under the card |

## Italic accent — how to use

The signature Khinext styling is **italic blue 900-weight** on one word per
headline. To opt-in, wrap the word with `<em data-accent>…</em>`:

```html
<h1>Your slot is <em data-accent>confirmed.</em></h1>
<h1>The plan is <em data-accent>set.</em></h1>
<h1>One day, <em data-accent>seven domains.</em></h1>
```

CSS in the template head handles it. Works on every major client.

## Sender setup checklist

1. Verify `tedxclifton.com` as a domain in Resend (DNS records) — or use
   `onboarding@resend.dev` for testing.
2. Set Vercel env vars:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`     = `TEDxClifton <hello@tedxclifton.com>`
   - `EMAIL_REPLY_TO` = `hello@tedxclifton.com`
3. Test by hitting **Confirm slot & send email** on any registration
   in the admin dashboard.

## What's NOT in this template (by design)

- No external CSS file — every style is inline, so it survives Gmail's
  CSS stripping and dark-mode auto-rewrites.
- No web fonts — uses the system stack (San Francisco / Segoe UI /
  Helvetica). Web fonts add 50–100kb and aren't honored in Outlook
  desktop anyway.
- No `<script>` — email clients block JS.
- No background-image on the outer card — Outlook strips them. The dark
  hero header uses a gradient via `background-image` on a `<td>`, which
  IS supported by Outlook 2016+ and silently downgrades to the solid
  `#040B1C` everywhere else.
