-- ============================================================================
-- 003 — Re-assert public INSERT policies for registrations + submissions
--
-- Run this in Supabase SQL Editor if you're seeing 42501 errors like:
--   "new row violates row-level security policy for table 'registrations'"
--   "new row violates row-level security policy for table 'submissions'"
--
-- These policies ARE in 001_init.sql, but if that migration only partially ran
-- (or someone reset RLS via the dashboard), this re-creates them safely.
-- ============================================================================

-- Belt-and-braces: make sure RLS is on (it MUST be on for policies to apply,
-- but enabling without the policy below would 100% block inserts).
alter table public.registrations enable row level security;
alter table public.submissions   enable row level security;

-- ───── registrations: anyone can insert, only admins can read/delete ─────
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

drop policy if exists "admins can update registrations" on public.registrations;
create policy "admins can update registrations"
  on public.registrations for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete registrations" on public.registrations;
create policy "admins can delete registrations"
  on public.registrations for delete
  to authenticated
  using (public.is_admin());

-- ───── submissions: anyone can insert, only admins can read/update ─────
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

-- ───── verify (returns the live policies — should list 4 each) ─────
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('registrations', 'submissions')
order by tablename, cmd;
