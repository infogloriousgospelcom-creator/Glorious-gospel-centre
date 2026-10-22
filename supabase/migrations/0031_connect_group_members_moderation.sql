-- 0031 — Connect Group membership moderation RPCs (Phase I-B4)
-- Staff approve / decline / remove via narrowly scoped SECURITY DEFINER
-- functions. Authenticated has no table UPDATE grants (0028); congregant
-- leave remains leave_connect_group (0029/0030).
--
-- Permission: connect_groups.members.manage (already seeded; SUPER_ADMIN + ADMIN).
-- decided_by / decided_at always come from auth.uid() / now() — never the client.
-- No broad UPDATE grants. No trigger change required (staff branch already allows
-- moderation when has_permission is true under the caller's JWT).

-- =====================================================================
-- 1. approve_connect_group_membership — PENDING → ACTIVE
-- =====================================================================

create or replace function public.approve_connect_group_membership(
  p_membership_id uuid,
  p_admin_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.connect_group_members;
  note text;
begin
  if auth.uid() is null then
    raise exception 'connect_group_members: authentication required'
      using errcode = '42501';
  end if;

  if not public.has_permission('connect_groups.members.manage') then
    raise exception 'connect_group_members: permission denied'
      using errcode = '42501';
  end if;

  if p_membership_id is null then
    raise exception 'connect_group_members: membership id required'
      using errcode = '22023';
  end if;

  if p_admin_note is not null then
    note := nullif(btrim(p_admin_note), '');
    if note is not null and char_length(note) > 2000 then
      raise exception 'connect_group_members: admin note too long'
        using errcode = '22001';
    end if;
  end if;

  select *
    into m
  from public.connect_group_members
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'connect_group_members: membership not found'
      using errcode = 'P0002';
  end if;

  if m.status is distinct from 'PENDING'::public.connect_group_member_status then
    raise exception 'connect_group_members: only PENDING memberships can be approved'
      using errcode = '23514';
  end if;

  -- PENDING already occupies a seat; exclude this row so approval does not
  -- double-count. Helper locks the group row for concurrent safety.
  if not public.connect_group_has_membership_capacity(m.connect_group_id, m.id) then
    raise exception 'connect_group_members: group is at capacity'
      using errcode = '23514';
  end if;

  update public.connect_group_members
  set
    status = 'ACTIVE'::public.connect_group_member_status,
    decided_by = auth.uid(),
    decided_at = now(),
    admin_note = case
      when p_admin_note is null then admin_note
      else note
    end
  where id = m.id;

  return m.id;
end;
$$;

revoke all on function public.approve_connect_group_membership(uuid, text) from public;
revoke all on function public.approve_connect_group_membership(uuid, text) from anon;
grant execute on function public.approve_connect_group_membership(uuid, text) to authenticated;

comment on function public.approve_connect_group_membership(uuid, text) is
  'Staff approve: PENDING → ACTIVE. decided_by=auth.uid(). EXECUTE: authenticated only.';

-- =====================================================================
-- 2. decline_connect_group_membership — PENDING → DECLINED
-- =====================================================================

create or replace function public.decline_connect_group_membership(
  p_membership_id uuid,
  p_admin_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.connect_group_members;
  note text;
begin
  if auth.uid() is null then
    raise exception 'connect_group_members: authentication required'
      using errcode = '42501';
  end if;

  if not public.has_permission('connect_groups.members.manage') then
    raise exception 'connect_group_members: permission denied'
      using errcode = '42501';
  end if;

  if p_membership_id is null then
    raise exception 'connect_group_members: membership id required'
      using errcode = '22023';
  end if;

  if p_admin_note is not null then
    note := nullif(btrim(p_admin_note), '');
    if note is not null and char_length(note) > 2000 then
      raise exception 'connect_group_members: admin note too long'
        using errcode = '22001';
    end if;
  end if;

  select *
    into m
  from public.connect_group_members
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'connect_group_members: membership not found'
      using errcode = 'P0002';
  end if;

  if m.status is distinct from 'PENDING'::public.connect_group_member_status then
    raise exception 'connect_group_members: only PENDING memberships can be declined'
      using errcode = '23514';
  end if;

  update public.connect_group_members
  set
    status = 'DECLINED'::public.connect_group_member_status,
    decided_by = auth.uid(),
    decided_at = now(),
    admin_note = case
      when p_admin_note is null then admin_note
      else note
    end
  where id = m.id;

  return m.id;
end;
$$;

revoke all on function public.decline_connect_group_membership(uuid, text) from public;
revoke all on function public.decline_connect_group_membership(uuid, text) from anon;
grant execute on function public.decline_connect_group_membership(uuid, text) to authenticated;

comment on function public.decline_connect_group_membership(uuid, text) is
  'Staff decline: PENDING → DECLINED. decided_by=auth.uid(). EXECUTE: authenticated only.';

-- =====================================================================
-- 3. remove_connect_group_membership — ACTIVE → REMOVED
-- =====================================================================

create or replace function public.remove_connect_group_membership(
  p_membership_id uuid,
  p_admin_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.connect_group_members;
  note text;
begin
  if auth.uid() is null then
    raise exception 'connect_group_members: authentication required'
      using errcode = '42501';
  end if;

  if not public.has_permission('connect_groups.members.manage') then
    raise exception 'connect_group_members: permission denied'
      using errcode = '42501';
  end if;

  if p_membership_id is null then
    raise exception 'connect_group_members: membership id required'
      using errcode = '22023';
  end if;

  if p_admin_note is not null then
    note := nullif(btrim(p_admin_note), '');
    if note is not null and char_length(note) > 2000 then
      raise exception 'connect_group_members: admin note too long'
        using errcode = '22001';
    end if;
  end if;

  select *
    into m
  from public.connect_group_members
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'connect_group_members: membership not found'
      using errcode = 'P0002';
  end if;

  if m.status is distinct from 'ACTIVE'::public.connect_group_member_status then
    raise exception 'connect_group_members: only ACTIVE memberships can be removed'
      using errcode = '23514';
  end if;

  update public.connect_group_members
  set
    status = 'REMOVED'::public.connect_group_member_status,
    decided_by = auth.uid(),
    decided_at = now(),
    admin_note = case
      when p_admin_note is null then admin_note
      else note
    end
  where id = m.id;

  return m.id;
end;
$$;

revoke all on function public.remove_connect_group_membership(uuid, text) from public;
revoke all on function public.remove_connect_group_membership(uuid, text) from anon;
grant execute on function public.remove_connect_group_membership(uuid, text) to authenticated;

comment on function public.remove_connect_group_membership(uuid, text) is
  'Staff remove: ACTIVE → REMOVED. Preserves row. decided_by=auth.uid(). EXECUTE: authenticated only.';
