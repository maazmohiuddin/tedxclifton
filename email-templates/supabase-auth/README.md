# TEDxClifton — Supabase auth email templates

All templates in this folder match the TEDxClifton brand: dark-ink header
with blue gradient glow, italic blue accent on one word, dotted-line
details box, color-coded info/warning notes, grey footer chip.

Every file is **self-contained HTML** — no shared layout, no build step.
Open in a browser to preview, paste into Supabase Studio to apply.

## Where each file goes

In **Supabase Studio → Authentication → Email Templates**, find the
matching slot, click it, paste the file contents into the "Source" tab,
hit **Save**.

| File | Supabase template slot |
|---|---|
| `01-confirm-signup.html`      | Confirm signup |
| `02-invite-user.html`         | Invite user |
| `03-reset-password.html`      | Reset password |
| `04-change-email.html`        | Change Email Address |
| `05-reauthentication.html`    | Reauthentication |
| `06-password-changed.html`    | Password changed |
| `07-email-changed.html`       | Email address changed |
| `08-phone-changed.html`       | Phone number changed |
| `09-identity-linked.html`     | Identity linked |
| `10-identity-unlinked.html`   | Identity unlinked |
| `11-mfa-added.html`           | Multi-factor authentication method added |

The Magic link template you already pasted is **not** in this folder —
it's the canonical pattern; everything else here matches its style.

## Subject lines

For each template, set the subject in Supabase Studio (one line above
the HTML editor):

| Template | Suggested subject |
|---|---|
| Confirm signup            | Confirm your email — TEDxClifton |
| Invite user               | You're invited to TEDxClifton |
| Magic link                | Your magic link to TEDxClifton |
| Reset password            | Reset your TEDxClifton password |
| Change email address      | Confirm your new email — TEDxClifton |
| Reauthentication          | Verify your action — TEDxClifton |
| Password changed          | Your TEDxClifton password was changed |
| Email address changed     | Your TEDxClifton email was changed |
| Phone number changed      | Your TEDxClifton phone number was changed |
| Identity linked           | New sign-in method added to your account |
| Identity unlinked         | Sign-in method removed from your account |
| MFA method added          | Two-factor authentication enabled |

## Supabase template variables used

Supabase uses Go template syntax (`{{ .Variable }}`):

| Variable | Used in | What it is |
|---|---|---|
| `{{ .ConfirmationURL }}` | confirm-signup, invite-user, reset-password, change-email | The action URL the user clicks |
| `{{ .Token }}`            | reauthentication                                          | A 6-digit numeric code |
| `{{ .Email }}`            | all templates                                              | The user's current email address |
| `{{ .NewEmail }}`         | change-email, email-changed                                | The user's new email (when changing) |
| `{{ .SiteURL }}`          | (not used — but available)                                 | Your project's Site URL |

## Visual conventions

The templates use 3 colored "note" blocks:

| Color | Background | Use it for |
|---|---|---|
| **Amber** (`#FFF8E6` / `#735900`) | Caution — "didn't request this?" copy on action emails |
| **Blue**  (`#EEF3FF` / `#1A357A`) | Informational tip / clarification |
| **Red**   (`#FFEBEC` / `#8B1E2E`) | Urgent — security alerts on the "changed" notifications |

The italic blue accent (single word per headline) is the brand signature
— **don't break it**. Examples already in the templates:

- *"Your password was **changed**."*
- *"Two-factor **enabled**."*
- *"Let's get you back **in**."*
- *"Confirm **it's you**."*

## Sender / from address

Set this once in **Supabase Studio → Authentication → SMTP Settings**:

- **Sender email**: `hello@tedxclifton.com`
- **Sender name**: `TEDxClifton`

If you're on the default Supabase SMTP (limited to ~3/hr), upgrade to
custom SMTP via Resend, SendGrid, or AWS SES. The templates work the
same way either way.

## Testing without spamming yourself

1. Pick any template
2. In Supabase Studio → Authentication → URL Configuration → temporarily
   set Site URL to a real testable URL (e.g. your Vercel preview)
3. Trigger the auth event (sign up, reset password, etc.) from the app
4. Check your inbox — verify the rendering on Gmail, Apple Mail and
   Outlook web (each renders subtly differently)

For pure design preview without sending: just open the `.html` file in
a browser. The `{{ .Token }}` etc. placeholders will show literally —
expected, that's how you know the template was preserved.
