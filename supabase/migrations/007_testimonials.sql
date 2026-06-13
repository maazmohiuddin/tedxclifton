-- ============================================================================
-- TEDxClifton — Testimonials / feedback system
--   • testimonials       — attendee feedback with verification + moderation
--   • Storage bucket: testimonials/ (PUBLIC — avatars shown on the showcase)
--
-- Verification is computed server-side (API route, service role) by matching
-- the submitted email against registrations (VIP via track='vip_sponsor')
-- and delivered invitations (email_send_records). Clients can never set it.
-- ============================================================================

-- ---------- enums ----------
do $$ begin
  create type testimonial_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_tier as enum ('vip', 'attendee', 'community');
exception when duplicate_object then null; end $$;

-- ---------- testimonials ----------
create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text not null,
  designation   text,
  company       text,
  body          text not null,
  rating        smallint check (rating between 1 and 5),
  avatar_path   text,                              -- path inside `testimonials` bucket
  status        testimonial_status not null default 'pending',
  verification  verification_tier  not null default 'community',
  featured      boolean not null default false,
  reviewed_at   timestamptz,
  reviewed_by   uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

create index if not exists testimonials_created_idx  on public.testimonials (created_at desc);
create index if not exists testimonials_status_idx    on public.testimonials (status);
create index if not exists testimonials_email_idx      on public.testimonials (lower(email));
create index if not exists testimonials_featured_idx   on public.testimonials (featured) where featured = true;

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
alter table public.testimonials enable row level security;

-- Public showcase: anyone may read APPROVED testimonials.
-- (Public pages select only non-PII columns; email is never exposed client-side.)
drop policy if exists "public read approved testimonials" on public.testimonials;
create policy "public read approved testimonials"
  on public.testimonials for select
  to anon, authenticated
  using (status = 'approved');

-- Admins can read everything (pending / rejected included) + realtime.
drop policy if exists "admins read testimonials" on public.testimonials;
create policy "admins read testimonials"
  on public.testimonials for select
  to authenticated
  using (public.is_admin());

-- Admins manage (update / delete). Inserts happen via the service role API.
drop policy if exists "admins manage testimonials" on public.testimonials;
create policy "admins manage testimonials"
  on public.testimonials for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- STORAGE: `testimonials` bucket (PUBLIC — avatars rendered on the showcase)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('testimonials', 'testimonials', true)
on conflict (id) do nothing;

-- Anyone can upload an avatar (keyed by a uuid the app generates).
drop policy if exists "anon can upload testimonial avatars" on storage.objects;
create policy "anon can upload testimonial avatars"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'testimonials');

-- Anyone can read avatars (public bucket).
drop policy if exists "public can read testimonial avatars" on storage.objects;
create policy "public can read testimonial avatars"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'testimonials');

-- ============================================================================
-- REALTIME: feed the admin moderation dashboard.
-- ============================================================================
do $$ begin
  alter publication supabase_realtime add table public.testimonials;
exception when duplicate_object then null; end $$;
