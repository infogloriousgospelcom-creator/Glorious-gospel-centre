-- 0017 — Sermon series
-- New table `sermon_series` with admin-controlled CRUD.
-- New nullable column `sermons.series_id` with ON DELETE SET NULL so
-- deleting a series does not cascade-delete sermons.

create table if not exists public.sermon_series (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  hero_image text,
  start_date date,
  end_date date,
  status public.content_status not null default 'DRAFT',
  sort_order int not null default 0,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sermon_series_status on public.sermon_series(status);
create index if not exists idx_sermon_series_slug on public.sermon_series(slug);

-- Add series_id to sermons if missing.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sermons' and column_name = 'series_id'
  ) then
    alter table public.sermons
      add column series_id uuid references public.sermon_series(id) on delete set null;
  end if;
end$$;

create index if not exists idx_sermons_series on public.sermons(series_id);

-- updated_at trigger for sermon_series.
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_sermon_series') then
    create trigger set_updated_at_sermon_series before update on public.sermon_series
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;

-- Enable RLS.
alter table public.sermon_series enable row level security;

-- Public SELECT: only published series.
drop policy if exists sermon_series_public_select on public.sermon_series;
create policy sermon_series_public_select on public.sermon_series
  for select to anon, authenticated
  using (public.is_published(status));

-- Admin write: requires content.manage permission.
drop policy if exists sermon_series_admin_write on public.sermon_series;
create policy sermon_series_admin_write on public.sermon_series
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));
