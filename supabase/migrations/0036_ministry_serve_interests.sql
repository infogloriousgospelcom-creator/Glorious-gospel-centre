-- 0036 — Ministry Serve Interest (Phase K)
-- Owned congregant workflow: express interest in a ministry (or general serve).
-- Staff triage via serve_interests.manage. No volunteer roster, scheduling,
-- leaders, notifications, or guest submissions.

-- =====================================================================
-- 1. Status enum
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'ministry_serve_interest_status') then
    create type public.ministry_serve_interest_status as enum (
      'NEW',
      'CONTACTED',
      'ACCEPTED',
      'DECLINED',
      'CLOSED'
    );
  end if;
end$$;

-- =====================================================================
-- 2. Table
-- =====================================================================

create table if not exists public.ministry_serve_interests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  ministry_id uuid references public.ministries(id) on delete set null,
  status public.ministry_serve_interest_status not null default 'NEW',
  member_note text,
  staff_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ministry_serve_interests_member_note_len
    check (member_note is null or char_length(member_note) <= 500),
  constraint ministry_serve_interests_staff_note_len
    check (staff_note is null or char_length(staff_note) <= 2000)
);

create index if not exists idx_serve_interests_profile_created
  on public.ministry_serve_interests (profile_id, created_at desc);

create index if not exists idx_serve_interests_status_created
  on public.ministry_serve_interests (status, created_at desc);

create index if not exists idx_serve_interests_ministry
  on public.ministry_serve_interests (ministry_id)
  where ministry_id is not null;

-- One open interest per member + ministry. ACCEPTED is still "open" so the
-- same ministry cannot be re-submitted while staff have accepted it.
create unique index if not exists idx_serve_interests_open_ministry
  on public.ministry_serve_interests (profile_id, ministry_id)
  where status in (
    'NEW'::public.ministry_serve_interest_status,
    'CONTACTED'::public.ministry_serve_interest_status,
    'ACCEPTED'::public.ministry_serve_interest_status
  )
  and ministry_id is not null;

create unique index if not exists idx_serve_interests_open_general
  on public.ministry_serve_interests (profile_id)
  where status in (
    'NEW'::public.ministry_serve_interest_status,
    'CONTACTED'::public.ministry_serve_interest_status,
    'ACCEPTED'::public.ministry_serve_interest_status
  )
  and ministry_id is null;

comment on table public.ministry_serve_interests is
  'Congregant ministry serve interests. Own-row SELECT/INSERT; staff triage via RPC. No guest access.';

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_ministry_serve_interests') then
    create trigger set_updated_at_ministry_serve_interests
      before update on public.ministry_serve_interests
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;

-- =====================================================================
-- 3. Permission — SUPER_ADMIN + ADMIN only
-- =====================================================================

insert into public.permissions (key, description) values
  (
    'serve_interests.manage',
    'Review and update ministry serve-interest submissions'
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
  select id into p_id from public.permissions where key = 'serve_interests.manage';

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
-- 4. BEFORE INSERT — ownership, verified email, published ministry
-- =====================================================================

create or replace function public.tg_ministry_serve_interests_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ministry_ok boolean;
begin
  if auth.uid() is null then
    raise exception 'ministry_serve_interests: authentication required'
      using errcode = '42501';
  end if;

  -- Reuse I-B10 helper: checks auth.uid() against auth.users.email_confirmed_at.
  -- No client EXECUTE; no arbitrary user ID. Name is membership-scoped but the
  -- check is the same verified-email invariant.
  perform public.require_verified_email_for_membership();

  if new.profile_id is distinct from auth.uid() then
    raise exception 'ministry_serve_interests: cannot create interest for another profile'
      using errcode = '42501';
  end if;

  new.profile_id := auth.uid();
  new.status := 'NEW'::public.ministry_serve_interest_status;
  new.staff_note := null;
  new.reviewed_by := null;
  new.reviewed_at := null;

  if new.member_note is not null then
    new.member_note := nullif(btrim(new.member_note), '');
    if new.member_note is not null and char_length(new.member_note) > 500 then
      raise exception 'ministry_serve_interests: member note too long'
        using errcode = '22001';
    end if;
  end if;

  if new.ministry_id is not null then
    select exists (
      select 1
      from public.ministries m
      where m.id = new.ministry_id
        and m.status = 'PUBLISHED'::public.content_status
    ) into ministry_ok;

    if not ministry_ok then
      raise exception 'ministry_serve_interests: ministry is not available'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists ministry_serve_interests_before_insert on public.ministry_serve_interests;
create trigger ministry_serve_interests_before_insert
  before insert on public.ministry_serve_interests
  for each row execute function public.tg_ministry_serve_interests_before_insert();

-- =====================================================================
-- 5. BEFORE UPDATE — members cannot mutate; staff path is RPC
-- =====================================================================

create or replace function public.tg_ministry_serve_interests_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_permission('serve_interests.manage') then
    if new.profile_id is distinct from old.profile_id
       or new.ministry_id is distinct from old.ministry_id
       or new.member_note is distinct from old.member_note
       or new.created_at is distinct from old.created_at
    then
      raise exception 'ministry_serve_interests: staff cannot change congregant-owned fields'
        using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'ministry_serve_interests: members cannot modify serve interests'
    using errcode = '42501';
end;
$$;

drop trigger if exists ministry_serve_interests_before_update on public.ministry_serve_interests;
create trigger ministry_serve_interests_before_update
  before update on public.ministry_serve_interests
  for each row execute function public.tg_ministry_serve_interests_before_update();

-- =====================================================================
-- 6. Staff triage RPC — reviewer identity is server-derived
-- =====================================================================

create or replace function public.update_ministry_serve_interest(
  p_interest_id uuid,
  p_status public.ministry_serve_interest_status,
  p_staff_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  note text;
begin
  if auth.uid() is null then
    raise exception 'ministry_serve_interests: authentication required'
      using errcode = '42501';
  end if;

  if not public.has_permission('serve_interests.manage') then
    raise exception 'ministry_serve_interests: permission denied'
      using errcode = '42501';
  end if;

  if p_interest_id is null then
    raise exception 'ministry_serve_interests: interest id required'
      using errcode = '22023';
  end if;

  if p_staff_note is not null then
    note := nullif(btrim(p_staff_note), '');
    if note is not null and char_length(note) > 2000 then
      raise exception 'ministry_serve_interests: staff note too long'
        using errcode = '22001';
    end if;
  end if;

  update public.ministry_serve_interests
  set
    status = p_status,
    staff_note = case
      when p_staff_note is null then staff_note
      else note
    end,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where id = p_interest_id;

  if not found then
    raise exception 'ministry_serve_interests: interest not found'
      using errcode = 'P0002';
  end if;

  return p_interest_id;
end;
$$;

revoke all on function public.update_ministry_serve_interest(
  uuid, public.ministry_serve_interest_status, text
) from public;
revoke all on function public.update_ministry_serve_interest(
  uuid, public.ministry_serve_interest_status, text
) from anon;
grant execute on function public.update_ministry_serve_interest(
  uuid, public.ministry_serve_interest_status, text
) to authenticated;

comment on function public.update_ministry_serve_interest(
  uuid, public.ministry_serve_interest_status, text
) is
  'Staff triage: update status/staff_note. reviewed_by/reviewed_at from auth.uid()/now().';

-- =====================================================================
-- 7. RLS + least-privilege grants
-- =====================================================================

alter table public.ministry_serve_interests enable row level security;

drop policy if exists serve_interests_self_select on public.ministry_serve_interests;
create policy serve_interests_self_select on public.ministry_serve_interests
  for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists serve_interests_self_insert on public.ministry_serve_interests;
create policy serve_interests_self_insert on public.ministry_serve_interests
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and status = 'NEW'::public.ministry_serve_interest_status
  );

drop policy if exists serve_interests_admin_select on public.ministry_serve_interests;
create policy serve_interests_admin_select on public.ministry_serve_interests
  for select to authenticated
  using (public.has_permission('serve_interests.manage'));

-- No member UPDATE/DELETE. Staff writes go through the SECURITY DEFINER RPC.
-- Admin SELECT policy covers safe columns on the user client; private columns
-- are not granted to authenticated (staff private reads use service-role
-- after has_permission).

revoke all on table public.ministry_serve_interests from anon, authenticated;

grant select (
  id,
  profile_id,
  ministry_id,
  status,
  member_note,
  created_at,
  updated_at
) on table public.ministry_serve_interests to authenticated;

grant insert (
  id,
  profile_id,
  ministry_id,
  status,
  member_note
) on table public.ministry_serve_interests to authenticated;

-- Intentionally NOT granted to authenticated:
--   staff_note, reviewed_by, reviewed_at
--   UPDATE / DELETE
