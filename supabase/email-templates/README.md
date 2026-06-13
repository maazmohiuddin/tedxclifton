# TEDxClifton — Supabase email templates

Drop-in branded email templates for the Khinext auth flows.

## Magic Link (admin sign-in)

**File:** `magic-link.html`

**Where to paste:**

1. Open **<https://supabase.com/dashboard/project/rqgrzoiqtnenfydgdfho/auth/templates>**
2. Click the **Magic Link** tab
3. Update the **Subject heading**:

   ```
   Sign in to TEDxClifton — your magic link
   ```

4. Replace the **Message body** field with the entire contents of `magic-link.html`
5. Click **Save**

That's it. Next time someone hits "Send magic link" on `/admin/login`, they'll get the branded version.

## Template variables used

| Variable | What it is |
|---|---|
| `{{ .ConfirmationURL }}` | The magic-link URL (button + plain-text fallback) |
| `{{ .Email }}` | Recipient email (shown in the details block + sub-footer) |

## Design choices

- **Table-based layout** — works in Outlook 2007+, Gmail (web + iOS + Android), Apple Mail, etc.
- **Inline styles + bulletproof CTA button** — the `<!--[if mso]>` block gives Outlook a proper VML button while every other client gets the regular `<a>` tag.
- **System fonts only** (`Helvetica Neue` → Helvetica → Arial fallback). Most email clients strip `@font-face`, so we lean on what's installed locally.
- **Brand-faithful but email-safe**:
  - Dark `#040B1C` header with a layered blue radial glow (works in modern clients; gracefully degrades to solid ink in legacy Outlook).
  - Italic `next` accent in `#8FAFFF` (lighter than the in-app `#316BFF` — gives better contrast on dark on retina screens).
  - White card body with the same blue CTA pill, ticket-style details block, and the signature footer pattern.
- **Mobile**: media query collapses padding + button to full-width below 620px.
- **Inbox preview** preheader is hidden in body but populates the preview line shown in Gmail / Apple Mail.
- **Security disclaimer** in soft amber explaining what to do if the user didn't request the email.

## Optional: other templates

If you also want to brand the **Confirm Signup**, **Reset Password**, **Invite User** and **Change Email** templates, the same skeleton in `magic-link.html` works — only the headline and body copy change. Let me know and I'll generate them too.
