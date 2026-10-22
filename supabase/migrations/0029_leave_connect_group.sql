-- 0029 — Connect Group member leave RPC (Phase I-B3)
-- Members have no table UPDATE grants (0028). Leaving an ACTIVE membership
-- requires a narrowly scoped SECURITY DEFINER function that:
--   * uses auth.uid() for ownership
--   * only allows ACTIVE → LEFT
--   * sets left_at
--   * never sets decided_by / admin_note / decided_at
-- Also extends the before-update guard so this transition is permitted
-- when performed for the caller's own row (defense in depth for the RPC).

-- =====================================================================
-- 1. Update before-update guard to allow member leave
-- =====================================================================

create or replace function public.tg_connect_group_members_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('connect_groups.members.manage') then
    -- Allowed: own ACTIVE → LEFT with left_at set (member leave via RPC).
    if auth.uid() is not null
       and old.profile_id = auth.uid()
       and new.profile_id = old.profile_id
       and new.connect_group_id = old.connect_group_id
       and old.status = 'ACTIVE'::public.connect_group_member_status
       and new.status = 'LEFT'::public.connect_group_member_status
       and new.left_at is not null
       and new.decided_at is not distinct from old.decided_at
       and new.decided_by is not distinct from old.decided_by
       and new.admin_note is not distinct from old.admin_note
       and new.requested_at is not distinct from old.requested_at
       and new.member_note is not distinct from old.member_note
    then
      return new;
    end if;

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

-- =====================================================================
-- 2. leave_connect_group(membership_id)
-- =====================================================================

create or replace function public.leave_connect_group(p_membership_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.connect_group_members;
begin
  if auth.uid() is null then
    raise exception 'connect_group_members: authentication required'
      using errcode = '42501';
  end if;

  if p_membership_id is null then
    raise exception 'connect_group_members: membership id required'
      using errcode = '22023';
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

  if m.profile_id is distinct from auth.uid() then
    raise exception 'connect_group_members: cannot leave another member''s group'
      using errcode = '42501';
  end if;

  -- Idempotent: already LEFT.
  if m.status = 'LEFT'::public.connect_group_member_status then
    return m.id;
  end if;

  if m.status is distinct from 'ACTIVE'::public.connect_group_member_status then
    raise exception 'connect_group_members: only ACTIVE memberships can be left'
      using errcode = '23514';
  end if;

  update public.connect_group_members
  set
    status = 'LEFT'::public.connect_group_member_status,
    left_at = coalesce(left_at, now())
  where id = m.id;

  return m.id;
end;
$$;

revoke all on function public.leave_connect_group(uuid) from public;
grant execute on function public.leave_connect_group(uuid) to authenticated;

comment on function public.leave_connect_group(uuid) is
  'Member leave: ACTIVE → LEFT for the caller''s own membership only. No admin fields.';
