-- 0035 — Congregant lifecycle reliability hardening (Phase I-B10)
-- 1) membership_generation: durable lifecycle identity for notification dedupe
--    across re-request cycles (same membership row, new generation).
-- 2) Database-enforced verified-email for congregant join INSERT and re-request.
-- No email/WhatsApp/Realtime. No leave/re-request Activity events.
-- No announcement fan-out. No new congregant product surfaces.

-- =====================================================================
-- 1. membership_generation column (Option A)
-- =====================================================================

alter table public.connect_group_members
  add column if not exists membership_generation integer not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'connect_group_members_membership_generation_positive'
      and conrelid = 'public.connect_group_members'::regclass
  ) then
    alter table public.connect_group_members
      add constraint connect_group_members_membership_generation_positive
      check (membership_generation >= 1);
  end if;
end$$;

comment on column public.connect_group_members.membership_generation is
  'Lifecycle cycle counter. Starts at 1; increments on terminal → PENDING re-request. Used in Activity notification dedupe.';

-- Existing rows keep generation = 1 (default). Do not rewrite notification history.
-- Intentionally NOT granted to authenticated (internal). Default applies on INSERT.

-- =====================================================================
-- 2. Verified-email helper (trusted callers only — never expose auth.users)
-- =====================================================================

create or replace function public.require_verified_email_for_membership()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  confirmed_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'connect_group_members: authentication required'
      using errcode = '42501';
  end if;

  select u.email_confirmed_at
    into confirmed_at
  from auth.users u
  where u.id = auth.uid();

  if confirmed_at is null then
    raise exception 'connect_group_members: email verification required'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.require_verified_email_for_membership() from public;
revoke all on function public.require_verified_email_for_membership() from anon;
revoke all on function public.require_verified_email_for_membership() from authenticated;

comment on function public.require_verified_email_for_membership() is
  'Trusted check: auth.uid() must have auth.users.email_confirmed_at. No client EXECUTE. Used by membership insert trigger and re-request RPC.';

-- =====================================================================
-- 3. BEFORE INSERT: force generation=1 + verified email for congregants
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

    -- Defense in depth: verified email required at DB boundary (I-B10).
    perform public.require_verified_email_for_membership();

    if new.status is distinct from 'PENDING'::public.connect_group_member_status then
      raise exception 'connect_group_members: members may only create PENDING requests'
        using errcode = '42501';
    end if;

    -- Strip moderation / lifecycle fields on self-insert.
    new.decided_at := null;
    new.decided_by := null;
    new.left_at := null;
    new.admin_note := null;
    -- First lifecycle cycle always starts at generation 1 (ignore client).
    new.membership_generation := 1;

    if not public.connect_group_is_open_for_join(new.connect_group_id) then
      raise exception 'connect_group_members: group is not open for membership requests'
        using errcode = '23514';
    end if;
  else
    -- Staff inserts: ensure generation is at least 1.
    if new.membership_generation is null or new.membership_generation < 1 then
      new.membership_generation := 1;
    end if;
  end if;

  if new.status in (
    'PENDING'::public.connect_group_member_status,
    'ACTIVE'::public.connect_group_member_status
  ) then
    if not public.connect_group_has_membership_capacity(new.connect_group_id, null) then
      raise exception 'connect_group_members: group is at capacity'
        using errcode = '23514';
    end if;
  end if;

  if new.requested_at is null then
    new.requested_at := now();
  end if;

  return new;
end;
$$;

-- =====================================================================
-- 4. BEFORE UPDATE: allow generation+1 only on member re-request path
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
       and new.membership_generation is not distinct from old.membership_generation
    then
      return new;
    end if;

    -- Allowed: own DECLINED|LEFT|REMOVED → PENDING (member re-request via RPC).
    -- Generation must advance by exactly 1 for the new lifecycle cycle.
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
       and new.membership_generation = old.membership_generation + 1
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
       or new.membership_generation is distinct from old.membership_generation
    then
      raise exception 'connect_group_members: members cannot modify moderation fields'
        using errcode = '42501';
    end if;
  else
    -- Staff: changing into PENDING/ACTIVE must respect capacity (exclude self).
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

    if new.membership_generation is null or new.membership_generation < 1 then
      new.membership_generation := coalesce(old.membership_generation, 1);
    end if;
  end if;

  return new;
end;
$$;

-- =====================================================================
-- 5. Re-request: increment generation + verified email
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

  -- Defense in depth: verified email required at DB boundary (I-B10).
  perform public.require_verified_email_for_membership();

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
    admin_note = null,
    membership_generation = membership_generation + 1
  where id = m.id;

  return m.id;
end;
$$;

revoke all on function public.rerequest_connect_group_membership(uuid, text) from public;
revoke all on function public.rerequest_connect_group_membership(uuid, text) from anon;
grant execute on function public.rerequest_connect_group_membership(uuid, text) to authenticated;

comment on function public.rerequest_connect_group_membership(uuid, text) is
  'Member re-request: DECLINED|LEFT|REMOVED → PENDING on same row; increments membership_generation; requires verified email.';

-- =====================================================================
-- 6. emit_member_notification — include membership_generation in dedupe
-- =====================================================================

drop function if exists public.emit_member_notification(
  uuid, text, text, text, text, text, uuid, text
);

create or replace function public.emit_member_notification(
  p_recipient_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_href text,
  p_source_type text,
  p_source_id uuid,
  p_event_key text,
  p_membership_generation integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dedupe text;
  v_href text;
  v_id uuid;
  v_gen integer;
begin
  if p_recipient_id is null then
    raise exception 'member_notifications: recipient required'
      using errcode = '22023';
  end if;

  if p_kind is null or btrim(p_kind) = '' then
    raise exception 'member_notifications: kind required'
      using errcode = '22023';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'member_notifications: title required'
      using errcode = '22023';
  end if;

  if p_source_type is null or btrim(p_source_type) = '' then
    raise exception 'member_notifications: source_type required'
      using errcode = '22023';
  end if;

  if p_event_key is null or btrim(p_event_key) = '' then
    raise exception 'member_notifications: event_key required'
      using errcode = '22023';
  end if;

  v_gen := coalesce(p_membership_generation, 1);
  if v_gen < 1 then
    raise exception 'member_notifications: invalid membership_generation'
      using errcode = '22023';
  end if;

  v_href := nullif(btrim(p_href), '');
  if v_href is not null then
    if v_href !~ '^/[a-zA-Z0-9][a-zA-Z0-9/_-]*$'
       or position(':' in v_href) > 0
       or position('//' in v_href) > 0
       or v_href ~* '^/admin(/|$)' then
      raise exception 'member_notifications: unsafe href'
        using errcode = '23514';
    end if;
  end if;

  -- Dedupe per lifecycle cycle: same-cycle retries collide; new generation does not.
  v_dedupe := p_recipient_id::text
    || ':' || btrim(p_source_type)
    || ':' || coalesce(p_source_id::text, 'none')
    || ':g' || v_gen::text
    || ':' || btrim(p_event_key);

  -- Keep within length constraint (240).
  if char_length(v_dedupe) > 240 then
    raise exception 'member_notifications: dedupe_key too long'
      using errcode = '22001';
  end if;

  insert into public.member_notifications (
    recipient_id,
    kind,
    title,
    body,
    href,
    source_type,
    source_id,
    event_key,
    dedupe_key
  ) values (
    p_recipient_id,
    btrim(p_kind),
    left(btrim(p_title), 160),
    case when p_body is null then null else left(btrim(p_body), 500) end,
    v_href,
    btrim(p_source_type),
    p_source_id,
    btrim(p_event_key),
    v_dedupe
  )
  on conflict (dedupe_key) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.emit_member_notification(
  uuid, text, text, text, text, text, uuid, text, integer
) from public;
revoke all on function public.emit_member_notification(
  uuid, text, text, text, text, text, uuid, text, integer
) from anon;
revoke all on function public.emit_member_notification(
  uuid, text, text, text, text, text, uuid, text, integer
) from authenticated;

comment on function public.emit_member_notification(
  uuid, text, text, text, text, text, uuid, text, integer
) is
  'Trusted emit. Dedupe includes membership_generation so re-request cycles notify again; same-cycle retries stay idempotent.';

-- =====================================================================
-- 7. Moderation RPCs — pass membership_generation into emit
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
  g_name text;
  g_slug text;
  n_href text;
  n_body text;
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

  select cg.name, cg.slug
    into g_name, g_slug
  from public.connect_groups cg
  where cg.id = m.connect_group_id;

  if g_slug is not null and g_slug ~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*$' then
    n_href := '/connect/' || g_slug;
  else
    n_href := '/account';
  end if;

  n_body := case
    when g_name is not null and btrim(g_name) <> '' then
      'Your request to join ' || btrim(g_name) || ' was approved.'
    else
      'Your Connect Group request was approved.'
  end;

  perform public.emit_member_notification(
    m.profile_id,
    'connect_group.approved',
    'Connect Group request approved',
    n_body,
    n_href,
    'connect_group_member',
    m.id,
    'connect_group.approved',
    m.membership_generation
  );

  return m.id;
end;
$$;

revoke all on function public.approve_connect_group_membership(uuid, text) from public;
revoke all on function public.approve_connect_group_membership(uuid, text) from anon;
grant execute on function public.approve_connect_group_membership(uuid, text) to authenticated;

comment on function public.approve_connect_group_membership(uuid, text) is
  'Staff approve: PENDING → ACTIVE. Emits notification keyed by membership_generation. decided_by=auth.uid().';

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
  g_name text;
  g_slug text;
  n_href text;
  n_body text;
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

  select cg.name, cg.slug
    into g_name, g_slug
  from public.connect_groups cg
  where cg.id = m.connect_group_id;

  if g_slug is not null and g_slug ~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*$' then
    n_href := '/connect/' || g_slug;
  else
    n_href := '/account';
  end if;

  n_body := case
    when g_name is not null and btrim(g_name) <> '' then
      'Your request to join ' || btrim(g_name) || ' was not approved at this time.'
    else
      'Your Connect Group request was not approved at this time.'
  end;

  perform public.emit_member_notification(
    m.profile_id,
    'connect_group.declined',
    'Connect Group request update',
    n_body,
    n_href,
    'connect_group_member',
    m.id,
    'connect_group.declined',
    m.membership_generation
  );

  return m.id;
end;
$$;

revoke all on function public.decline_connect_group_membership(uuid, text) from public;
revoke all on function public.decline_connect_group_membership(uuid, text) from anon;
grant execute on function public.decline_connect_group_membership(uuid, text) to authenticated;

comment on function public.decline_connect_group_membership(uuid, text) is
  'Staff decline: PENDING → DECLINED. Emits notification keyed by membership_generation. decided_by=auth.uid().';

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
  g_name text;
  g_slug text;
  n_href text;
  n_body text;
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

  select cg.name, cg.slug
    into g_name, g_slug
  from public.connect_groups cg
  where cg.id = m.connect_group_id;

  if g_slug is not null and g_slug ~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*$' then
    n_href := '/connect/' || g_slug;
  else
    n_href := '/account';
  end if;

  n_body := case
    when g_name is not null and btrim(g_name) <> '' then
      'Your membership in ' || btrim(g_name) || ' has been updated.'
    else
      'Your Connect Group membership has been updated.'
  end;

  perform public.emit_member_notification(
    m.profile_id,
    'connect_group.removed',
    'Connect Group membership update',
    n_body,
    n_href,
    'connect_group_member',
    m.id,
    'connect_group.removed',
    m.membership_generation
  );

  return m.id;
end;
$$;

revoke all on function public.remove_connect_group_membership(uuid, text) from public;
revoke all on function public.remove_connect_group_membership(uuid, text) from anon;
grant execute on function public.remove_connect_group_membership(uuid, text) to authenticated;

comment on function public.remove_connect_group_membership(uuid, text) is
  'Staff remove: ACTIVE → REMOVED. Emits notification keyed by membership_generation. decided_by=auth.uid().';
