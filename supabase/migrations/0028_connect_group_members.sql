-- 0028 — Connect Group membership (Phase I-B2: schema + RLS only)
-- No join/leave UI, leaders, admin membership CMS, or notifications.
-- Membership is group-scoped (no global MEMBER / GROUP_LEADER roles).
--
-- Privacy: anon has no access. Authenticated members see only their own rows
-- and never receive admin_note / decided_by via column grants.
-- Eligibility + capacity are enforced in a SECURITY DEFINER trigger so
-- RLS cannot under-count other members' PENDING/ACTIVE rows.
--
-- Email confirmation is enforced in Phase I-B3 server actions (not here),
-- because safely reading auth.users.email_confirmed_at from RLS would
-- require exposing auth data or an unsafe dependency.

-- =====================================================================
-- 1. Enum
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'connect_group_member_status') then
    create type public.connect_group_member_status as enum (
      'PENDING',
      'ACTIVE',
      'DECLINED',
      'LEFT',
      'REMOVED'
    );
  end if;
end$$;

-- =====================================================================
-- 2. Table
-- =====================================================================

create table if not exists public.connect_group_members (
  id uuid primary key default gen_random_uuid(),
  connect_group_id uuid not null references public.connect_groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status public.connect_group_member_status not null default 'PENDING',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  left_at timestamptz,
  member_note text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connect_group_members_unique_member unique (connect_group_id, profile_id),
  constraint connect_group_members_member_note_len
    check (member_note is null or char_length(member_note) <= 500),
  constraint connect_group_members_admin_note_len
    check (admin_note is null or char_length(admin_note) <= 2000)
);

create index if not exists idx_connect_group_members_group
  on public.connect_group_members(connect_group_id);
create index if not exists idx_connect_group_members_profile
  on public.connect_group_members(profile_id);
create index if not exists idx_connect_group_members_status
  on public.connect_group_members(status);
create index if not exists idx_connect_group_members_group_status
  on public.connect_group_members(connect_group_id, status);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_connect_group_members') then
    create trigger set_updated_at_connect_group_members
      before update on public.connect_group_members
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;

-- =====================================================================
-- 3. Permission
-- =====================================================================

insert into public.permissions (key, description) values
  (
    'connect_groups.members.manage',
    'Manage Connect Group membership records (moderation)'
  )
on conflict (key) do nothing;

do $$
declare
  r_super uuid;
  r_admin uuid;
  p_id uuid;
begin
  select id into r_super from public.roles where key = 'SUPER_ADMIN';
  select id into r_admin from public.roles where key = 'ADMIN';
  select id into p_id from public.permissions where key = 'connect_groups.members.manage';

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
-- 4. Eligibility + capacity helpers (SECURITY DEFINER)
-- =====================================================================

create or replace function public.connect_group_is_open_for_join(p_group_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  g_status public.connect_group_status;
  g_published timestamptz;
begin
  select g.status, g.published_at
    into g_status, g_published
  from public.connect_groups g
  where g.id = p_group_id;

  if not found then
    return false;
  end if;

  return (
    g_status = 'OPEN'::public.connect_group_status
    and g_published is not null
  );
end;
$$;

revoke all on function public.connect_group_is_open_for_join(uuid) from public;
grant execute on function public.connect_group_is_open_for_join(uuid) to authenticated;

-- Locks the connect_groups row (FOR UPDATE) then counts PENDING+ACTIVE.
-- Returns true when the group can accept one additional PENDING/ACTIVE seat.
create or replace function public.connect_group_has_membership_capacity(
  p_group_id uuid,
  p_exclude_member_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  g_status public.connect_group_status;
  g_capacity int;
  occupied int;
begin
  select g.status, g.capacity
    into g_status, g_capacity
  from public.connect_groups g
  where g.id = p_group_id
  for update;

  if not found then
    return false;
  end if;

  -- Explicit FULL status always blocks new occupying seats.
  if g_status = 'FULL'::public.connect_group_status then
    return false;
  end if;

  -- Null capacity = unlimited (still requires OPEN + published for members).
  if g_capacity is null then
    return true;
  end if;

  select count(*)::int into occupied
  from public.connect_group_members m
  where m.connect_group_id = p_group_id
    and m.status in (
      'PENDING'::public.connect_group_member_status,
      'ACTIVE'::public.connect_group_member_status
    )
    and (p_exclude_member_id is null or m.id <> p_exclude_member_id);

  return occupied < g_capacity;
end;
$$;

revoke all on function public.connect_group_has_membership_capacity(uuid, uuid) from public;
grant execute on function public.connect_group_has_membership_capacity(uuid, uuid) to authenticated;

-- =====================================================================
-- 5. BEFORE INSERT guard
-- =====================================================================

create or replace function public.tg_connect_group_members_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_staff boolean;
begin
  is_staff := public.has_permission('connect_groups.members.manage');

  if not is_staff then
    -- Congregant self-request only.
    if auth.uid() is null or new.profile_id <> auth.uid() then
      raise exception 'connect_group_members: cannot create membership for another profile'
        using errcode = '42501';
    end if;

    if new.status is distinct from 'PENDING'::public.connect_group_member_status then
      raise exception 'connect_group_members: members may only create PENDING requests'
        using errcode = '42501';
    end if;

    -- Strip moderation / lifecycle fields on self-insert.
    new.decided_at := null;
    new.decided_by := null;
    new.left_at := null;
    new.admin_note := null;

    if not public.connect_group_is_open_for_join(new.connect_group_id) then
      raise exception 'connect_group_members: group is not open for membership requests'
        using errcode = '23514';
    end if;
  end if;

  -- Capacity applies to any insert that occupies a seat (PENDING or ACTIVE),
  -- including staff inserts — raise capacity first to override.
  if new.status in (
    'PENDING'::public.connect_group_member_status,
    'ACTIVE'::public.connect_group_member_status
  ) then
    if not public.connect_group_has_membership_capacity(new.connect_group_id, null) then
      raise exception 'connect_group_members: group is at capacity'
        using errcode = '23514';
    end if;
  end if;

  -- Staff inserting into non-open groups is allowed for moderation corrections,
  -- but congregants already blocked above. Staff ACTIVE/PENDING into FULL blocked
  -- by capacity helper (FULL => false).

  if new.requested_at is null then
    new.requested_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists connect_group_members_before_insert on public.connect_group_members;
create trigger connect_group_members_before_insert
  before insert on public.connect_group_members
  for each row execute function public.tg_connect_group_members_before_insert();

-- Prevent non-staff from changing ownership / moderation fields on UPDATE
-- (defense in depth; members have no UPDATE RLS policy in I-B2).
create or replace function public.tg_connect_group_members_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('connect_groups.members.manage') then
    if new.profile_id is distinct from old.profile_id
       or new.connect_group_id is distinct from old.connect_group_id
       or new.status is distinct from old.status
       or new.decided_at is distinct from old.decided_at
       or new.decided_by is distinct from old.decided_by
       or new.left_at is distinct from old.left_at
       or new.admin_note is distinct from old.admin_note
       or new.requested_at is distinct from old.requested_at
    then
      raise exception 'connect_group_members: members cannot modify moderation fields'
        using errcode = '42501';
    end if;
  else
    -- Staff changing into PENDING/ACTIVE must respect capacity (exclude self row).
    if new.status in (
         'PENDING'::public.connect_group_member_status,
         'ACTIVE'::public.connect_group_member_status
       )
       and (
         old.status is distinct from new.status
         or old.connect_group_id is distinct from new.connect_group_id
       )
    then
      if not public.connect_group_has_membership_capacity(new.connect_group_id, new.id) then
        raise exception 'connect_group_members: group is at capacity'
          using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists connect_group_members_before_update on public.connect_group_members;
create trigger connect_group_members_before_update
  before update on public.connect_group_members
  for each row execute function public.tg_connect_group_members_before_update();

-- =====================================================================
-- 6. RLS
-- =====================================================================

alter table public.connect_group_members enable row level security;

-- Anon: no policies (no access).

drop policy if exists connect_group_members_self_select on public.connect_group_members;
create policy connect_group_members_self_select on public.connect_group_members
  for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists connect_group_members_self_insert on public.connect_group_members;
create policy connect_group_members_self_insert on public.connect_group_members
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and status = 'PENDING'::public.connect_group_member_status
    and public.connect_group_is_open_for_join(connect_group_id)
  );

-- No member UPDATE / DELETE policies in I-B2 (leave/approve = I-B3).

drop policy if exists connect_group_members_admin_select on public.connect_group_members;
create policy connect_group_members_admin_select on public.connect_group_members
  for select to authenticated
  using (public.has_permission('connect_groups.members.manage'));

drop policy if exists connect_group_members_admin_insert on public.connect_group_members;
create policy connect_group_members_admin_insert on public.connect_group_members
  for insert to authenticated
  with check (public.has_permission('connect_groups.members.manage'));

drop policy if exists connect_group_members_admin_update on public.connect_group_members;
create policy connect_group_members_admin_update on public.connect_group_members
  for update to authenticated
  using (public.has_permission('connect_groups.members.manage'))
  with check (public.has_permission('connect_groups.members.manage'));

drop policy if exists connect_group_members_admin_delete on public.connect_group_members;
create policy connect_group_members_admin_delete on public.connect_group_members
  for delete to authenticated
  using (public.has_permission('connect_groups.members.manage'));

-- =====================================================================
-- 7. Column grants (least privilege)
-- =====================================================================
-- Ordinary authenticated congregants get ONLY:
--   SELECT: own-row safe columns (RLS) — never admin_note / decided_by
--   INSERT: member-request columns only — never moderation lifecycle columns
-- No UPDATE / DELETE grants to authenticated in I-B2 (no member policies).
-- Staff moderation (approve / decline / remove / notes) uses the established
-- service-role path AFTER has_permission('connect_groups.members.manage')
-- in server code (same pattern as testimonies.internal_notes). Admin RLS
-- policies above remain for row visibility of safe columns when using the
-- user-scoped client; they do not imply table UPDATE/DELETE privileges.

revoke all on table public.connect_group_members from anon, authenticated;

grant select (
  id,
  connect_group_id,
  profile_id,
  status,
  requested_at,
  decided_at,
  left_at,
  member_note,
  created_at,
  updated_at
) on table public.connect_group_members to authenticated;

grant insert (
  id,
  connect_group_id,
  profile_id,
  status,
  requested_at,
  member_note
) on table public.connect_group_members to authenticated;

-- Intentionally NOT granted to authenticated:
--   INSERT (decided_at, decided_by, left_at, admin_note)
--   UPDATE (any columns)
--   DELETE
-- Those writes are service-role + permission-checked server actions (I-B3+).
