-- 0032 — Connect Group membership re-request (Phase I-B5)
-- Congregant self-service: DECLINED | LEFT | REMOVED → PENDING on the SAME row.
-- No second insert. No staff reinstate. I-B3 leave and I-B4 moderation unchanged.
-- Prior decisions remain in audit_logs; membership row holds current state only.

-- =====================================================================
-- 1. before-update: allow own terminal → PENDING (member re-request)
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

    -- Allowed: own DECLINED|LEFT|REMOVED → PENDING (member re-request via RPC).
    if auth.uid() is not null
       and old.profile_id = auth.uid()
       and new.profile_id = old.profile_id
       and new.connect_group_id = old.connect_group_id
       and old.status in (
         'DECLINED'::public.connect_group_member_status,
         'LEFT'::public.connect_group_member_status,
         'REMOVED'::public.connect_group_member_status
       )
       and new.status = 'PENDING'::public.connect_group_member_status
       and new.requested_at is not null
       and new.left_at is null
       and new.decided_at is null
       and new.decided_by is null
       and new.admin_note is null
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
-- 2. rerequest_connect_group_membership
-- =====================================================================

create or replace function public.rerequest_connect_group_membership(
  p_membership_id uuid,
  p_member_note text default null
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

  if p_membership_id is null then
    raise exception 'connect_group_members: membership id required'
      using errcode = '22023';
  end if;

  if p_member_note is not null then
    note := nullif(btrim(p_member_note), '');
    if note is not null and char_length(note) > 500 then
      raise exception 'connect_group_members: member note too long'
        using errcode = '22001';
    end if;
  else
    note := null;
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
    raise exception 'connect_group_members: cannot re-request another member''s group'
      using errcode = '42501';
  end if;

  if m.status not in (
    'DECLINED'::public.connect_group_member_status,
    'LEFT'::public.connect_group_member_status,
    'REMOVED'::public.connect_group_member_status
  ) then
    raise exception 'connect_group_members: only DECLINED, LEFT, or REMOVED memberships can be re-requested'
      using errcode = '23514';
  end if;

  if not public.connect_group_is_open_for_join(m.connect_group_id) then
    raise exception 'connect_group_members: group is not open for membership requests'
      using errcode = '23514';
  end if;

  -- Terminal rows do not occupy PENDING/ACTIVE seats; exclude self for safety.
  if not public.connect_group_has_membership_capacity(m.connect_group_id, m.id) then
    raise exception 'connect_group_members: group is at capacity'
      using errcode = '23514';
  end if;

  update public.connect_group_members
  set
    status = 'PENDING'::public.connect_group_member_status,
    requested_at = now(),
    member_note = note,
    left_at = null,
    decided_at = null,
    decided_by = null,
    admin_note = null
  where id = m.id;

  return m.id;
end;
$$;

revoke all on function public.rerequest_connect_group_membership(uuid, text) from public;
revoke all on function public.rerequest_connect_group_membership(uuid, text) from anon;
grant execute on function public.rerequest_connect_group_membership(uuid, text) to authenticated;

comment on function public.rerequest_connect_group_membership(uuid, text) is
  'Member re-request: DECLINED|LEFT|REMOVED → PENDING on the same row. EXECUTE: authenticated only.';
