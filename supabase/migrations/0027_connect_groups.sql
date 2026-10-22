-- 0027 — Connect Groups (Phase I-A: public discovery + admin CMS)
-- No membership / join tables in this migration.
-- Ordinary congregant authentication is not yet a public product surface;
-- membership (PENDING/ACTIVE) belongs to Phase I-B after member auth exists.
--
-- Public may read only OPEN | FULL | CLOSED groups with published_at set
-- (not DRAFT | ARCHIVED, and not unpublished rows).
-- Public clients get column-level SELECT of public-safe fields only
-- (created_by / updated_by are never granted to anon/authenticated).
-- Writes: authenticated admins with connect_groups.manage (RLS-enforced).

-- =====================================================================
-- 1. Enum
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'connect_group_status') then
    create type public.connect_group_status as enum (
      'DRAFT',
      'OPEN',
      'FULL',
      'CLOSED',
      'ARCHIVED'
    );
  end if;
end$$;

-- =====================================================================
-- 2. Table
-- =====================================================================

create table if not exists public.connect_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  short_description text,
  description text,
  meeting_day smallint check (meeting_day is null or meeting_day between 0 and 6),
  meeting_time time,
  meeting_frequency text,
  location_note text,
  capacity int check (capacity is null or capacity > 0),
  -- Public-facing leader label only (not a profile FK). Phase I-B may add leaders table.
  leader_display_name text,
  ministry_id uuid references public.ministries(id) on delete set null,
  status public.connect_group_status not null default 'DRAFT',
  sort_order int not null default 0,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connect_groups_name_len check (char_length(name) between 2 and 120),
  constraint connect_groups_slug_len check (char_length(slug) between 2 and 120)
);

create unique index if not exists idx_connect_groups_slug on public.connect_groups(slug);
create index if not exists idx_connect_groups_status on public.connect_groups(status);
create index if not exists idx_connect_groups_meeting_day on public.connect_groups(meeting_day);
create index if not exists idx_connect_groups_sort on public.connect_groups(sort_order, name);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_connect_groups') then
    create trigger set_updated_at_connect_groups before update on public.connect_groups
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;

-- =====================================================================
-- 3. Permission
-- =====================================================================

insert into public.permissions (key, description) values
  ('connect_groups.manage', 'Manage Connect Groups discovery content')
on conflict (key) do nothing;

do $$
declare
  r_super uuid;
  r_admin uuid;
  p_id uuid;
begin
  select id into r_super from public.roles where key = 'SUPER_ADMIN';
  select id into r_admin from public.roles where key = 'ADMIN';
  select id into p_id from public.permissions where key = 'connect_groups.manage';

  if p_id is not null and r_super is not null then
    insert into public.role_permissions (role_id, permission_id)
    values (r_super, p_id)
    on conflict do nothing;
  end if;

  if p_id is not null and r_admin is not null then
    insert into public.role_permissions (role_id, permission_id)
    values (r_admin, p_id)
    on conflict do nothing;
  end if;
end$$;

-- =====================================================================
-- 4. RLS + column grants
-- =====================================================================

alter table public.connect_groups enable row level security;

-- No public INSERT/UPDATE/DELETE.
drop policy if exists connect_groups_public_write on public.connect_groups;

-- Public may read discoverable + published groups only.
drop policy if exists connect_groups_public_select on public.connect_groups;
create policy connect_groups_public_select on public.connect_groups
  for select to anon, authenticated
  using (
    status in (
      'OPEN'::public.connect_group_status,
      'FULL'::public.connect_group_status,
      'CLOSED'::public.connect_group_status
    )
    and published_at is not null
  );

drop policy if exists connect_groups_admin_select on public.connect_groups;
create policy connect_groups_admin_select on public.connect_groups
  for select to authenticated
  using (public.has_permission('connect_groups.manage'));

drop policy if exists connect_groups_admin_insert on public.connect_groups;
create policy connect_groups_admin_insert on public.connect_groups
  for insert to authenticated
  with check (public.has_permission('connect_groups.manage'));

drop policy if exists connect_groups_admin_update on public.connect_groups;
create policy connect_groups_admin_update on public.connect_groups
  for update to authenticated
  using (public.has_permission('connect_groups.manage'))
  with check (public.has_permission('connect_groups.manage'));

drop policy if exists connect_groups_admin_delete on public.connect_groups;
create policy connect_groups_admin_delete on public.connect_groups
  for delete to authenticated
  using (public.has_permission('connect_groups.manage'));

-- Public-safe columns only for anon/authenticated (matches testimonies pattern).
-- Internal audit UUIDs (created_by, updated_by) are never granted to clients.
revoke all on table public.connect_groups from anon, authenticated;
grant select (
  id,
  slug,
  name,
  short_description,
  description,
  meeting_day,
  meeting_time,
  meeting_frequency,
  location_note,
  capacity,
  leader_display_name,
  ministry_id,
  status,
  sort_order,
  published_at,
  created_at,
  updated_at
) on table public.connect_groups to anon, authenticated;

-- Admin CMS writes (RLS still requires connect_groups.manage).
grant insert, update, delete on table public.connect_groups to authenticated;
