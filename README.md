# TEDxClifton

**Next is Now.** The official website for TEDxClifton — an independently organized TED event in Clifton, Karachi, Pakistan.

A Next.js 14 (App Router) + Tailwind + Supabase application: an animated public site, public ticket registration (RSVP) and a "Call for Speakers" application flow, attendee testimonials, and a real-time admin dashboard with magic-link auth, bulk email, and an inbox.

> *x = an independently organized TED event.*

---

## Tech stack

| Layer        | Tool                                                  |
|--------------|-------------------------------------------------------|
| Framework    | Next.js 14 (App Router) + React 18 + TypeScript        |
| Styling      | Tailwind CSS · TEDxClifton design tokens (TED red / gold / black) |
| Animation    | Framer Motion + a custom WebGL (three.js) hero shader  |
| Database     | Supabase Postgres                                      |
| Auth         | Supabase Auth — email magic links (admin)              |
| Email        | SMTP (nodemailer) · Gmail/IMAP inbox sync              |
| Realtime     | Supabase Realtime — live admin dashboard               |
| Storage      | Supabase Storage — speaker decks + testimonial avatars |
| Deploy       | Vercel                                                 |
| Fonts        | Inter (via `next/font`)                                |
| Icons        | Lucide                                                 |

---

## Pages

| Route                | Description                                                      |
|----------------------|------------------------------------------------------------------|
| `/`                  | Public homepage: Hero, Event details, About, Last-event stats, The Experience, Partners, Testimonials, CTA |
| `/register`          | Reserve a seat (ticket RSVP → `registrations`)                   |
| `/submit`            | Apply to speak — talk proposal (→ `submissions`, optional file)  |
| `/testimonials`      | Attendee testimonials showcase + submission                     |
| `/contact`           | Contact form                                                    |
| `/admin`             | Admin dashboard — live registrations, talk proposals, testimonials, contact inbox, bulk email |
| `/admin/login`       | Email magic-link sign-in                                        |

---

## Setup

### 1. Install
```bash
npm install
```

### 2. Environment
Copy `.env.example` → `.env.local` and fill in your Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://gqvbwkhtdvqyhrediywr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...     # SECRET — never expose to the browser
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Find the keys at **Supabase → Project Settings → API**. The `SUPABASE_SERVICE_ROLE_KEY`
(the *secret* key) is required for the admin dashboard, testimonial verification, and email.

### 3. Database
The schema lives in `supabase/migrations/`. Run them in order in the Supabase SQL Editor
(or via the CLI). `001_init.sql` creates `registrations`, `submissions`, `admins`, RLS
policies, the `submissions` storage bucket, and realtime; later migrations add email
tracking, bulk-email logs, VIP tokens, and testimonials.

Add yourself as an admin:
```sql
insert into public.admins (email) values ('you@example.com');
```

### 4. Run
```bash
npm run dev
```
Open <http://localhost:3000>.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new> (Next.js auto-detected).
3. Add the env vars from `.env.example` under **Project Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
5. In **Supabase → Authentication → URL Configuration**, add your Vercel URL + `/auth/callback` redirect.

---

## Design system

TED brand, applied:

- **Primary red**: `#EB0028` · **Accent gold**: `#E9B872` · **Background**: black / near-black `#0A0204`
- **Off-white**: `#F7F7F7` · **Font**: Inter
- Signature treatment: one red *italic* accent word per headline (`.kx-accent`), soft halo glow.
- The "x" in TEDx is always uppercase-styled and red.

See `src/app/globals.css` and `tailwind.config.ts`. (Internal token names are prefixed
`khi-`/`kx-` for historical reasons; their *values* are the TEDxClifton palette.)

---

## License

Private project. TEDxClifton is an independently organized TED event.
