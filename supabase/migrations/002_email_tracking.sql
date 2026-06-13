-- ============================================================================
-- 002 — registration confirmation tracking
--   • Adds columns to track confirmation-email sends + slot-confirmed status
--   • Mirror columns on submissions too (so the same flow can be reused there)
-- ============================================================================

alter table public.registrations
  add column if not exists confirmed_at                  timestamptz,
  add column if not exists confirmation_email_sent_at    timestamptz,
  add column if not exists confirmation_email_count      int not null default 0,
  add column if not exists confirmed_by                  uuid references auth.users(id),
  add column if not exists admin_note                    text;

alter table public.submissions
  add column if not exists last_email_sent_at            timestamptz,
  add column if not exists email_count                   int not null default 0;

-- Helpful indexes for the dashboard's "confirmed" filter view.
create index if not exists registrations_confirmed_idx on public.registrations (confirmed_at desc nulls last);
