-- ============================================================================
-- TEDxClifton — initial schema
--   • registrations  — public event sign-ups
--   • submissions    — AI Expo project entries (with approval flow)
--   • admins         — whitelist of emails allowed into /admin
--   • Storage bucket: submissions/ (for uploaded pitch decks / files)
-- ============================================================================

-- ---------- extensions ----------
create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type submission_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type registration_track as enum (
    'general',
    'student',
    'vip',
    'partner'
  );
exception when duplicate_object then null; end $$;

-- ---------- registrations ----------
create table if not exists public.registrations (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text not null,
  phone         text,
  organisation  text,
  role          text not null,
  track         registration_track not null default 'general',
  referral      text,
  created_at    timestamptz not null default now()
);

create index if not exists registrations_created_idx on public.registrations (created_at desc);
create index if not exists registrations_email_idx   on public.registrations (lower(email));

-- ---------- submissions ----------
create table if not exists public.submissions (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  email          text not null,
  project        text not null,
  category       text not null,
  description    text not null,
  team_size      text,
  file_path      text,                  -- storage path inside `submissions` bucket
  status         submission_status not null default 'pending',
  reviewed_at    timestamptz,
  reviewed_by    uuid references auth.users(id),
  review_note    text,
  created_at     timestamptz not null default now()
);

create index if not exists submissions_created_idx  on public.submissions (created_at desc);
create index if not exists submissions_status_idx   on public.submissions (status);

-- ---------- admins ----------
create table if not exists public.admins (
  email      text primary key,
  added_at   timestamptz not null default now(),
  added_by   text
);

-- Bootstrap admin (override or add more via Supabase Studio).
insert into public.admins (email, added_by)
values ('maazuddin72@gmail.com', 'system')
on conflict (email) do nothing;

-- ---------- helper: is the calling user an admin? ----------
create or replace function public.is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

alter table public.registrations enable row level security;
alter table public.submissions   enable row level security;
alter table public.admins        enable row level security;

-- ---------- registrations ----------
-- Anyone can register (anon insert), only admins can read.
drop policy if exists "anon can insert registrations" on public.registrations;
create policy "anon can insert registrations"
  on public.registrations for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admins can read registrations" on public.registrations;
create policy "admins can read registrations"
  on public.registrations for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins can delete registrations" on public.registrations;
create policy "admins can delete registrations"
  on public.registrations for delete
  to authenticated
  using (public.is_admin());

-- ---------- submissions ----------
-- Anyone can submit a project, only admins can read / update.
drop policy if exists "anon can insert submissions" on public.submissions;
create policy "anon can insert submissions"
  on public.submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admins can read submissions" on public.submissions;
create policy "admins can read submissions"
  on public.submissions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins can update submissions" on public.submissions;
create policy "admins can update submissions"
  on public.submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete submissions" on public.submissions;
create policy "admins can delete submissions"
  on public.submissions for delete
  to authenticated
  using (public.is_admin());

-- ---------- admins table ----------
-- Only admins can manage the admin whitelist (no anon access).
drop policy if exists "admins can read admins" on public.admins;
create policy "admins can read admins"
  on public.admins for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins can manage admins" on public.admins;
create policy "admins can manage admins"
  on public.admins for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- STORAGE: `submissions` bucket (private, with admin-read policy)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- Anyone can upload, files keyed by uuid the app generates.
drop policy if exists "anon can upload submission files" on storage.objects;
create policy "anon can upload submission files"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'submissions');

-- Only admins can read uploaded files.
drop policy if exists "admins can read submission files" on storage.objects;
create policy "admins can read submission files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'submissions' and public.is_admin());

-- ============================================================================
-- REALTIME: enable realtime replication for the admin dashboard.
-- ============================================================================

alter publication supabase_realtime add table public.registrations;
alter publication supabase_realtime add table public.submissions;
