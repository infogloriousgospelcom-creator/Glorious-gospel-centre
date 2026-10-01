-- 0038 — Leader category (Pastors vs general Leadership)
--
-- Adds an optional content category to the existing `leaders` table so a
-- distinct "Pastors" section can be served from the same, proven architecture
-- (same RLS, same storage bucket, same server actions) instead of duplicating
-- the table.
--
-- Backwards compatible:
--   * additive only — no columns renamed, dropped, or rewritten
--   * existing rows are backfilled with 'LEADERSHIP', so the public
--     Leadership page (all published leaders) is unchanged and the new
--     Pastors page starts empty until an admin categorises someone
--   * no RLS policy changes — published-only public read and
--     content.manage admin write continue to govern every row

do $$
begin
  if not exists (select 1 from pg_type where typname = 'leader_category') then
    create type public.leader_category as enum (
      'PASTOR',
      'LEADERSHIP'
    );
  end if;
end$$;

alter table public.leaders
  add column if not exists category public.leader_category not null default 'LEADERSHIP';

create index if not exists idx_leaders_status_category
  on public.leaders(status, category);
