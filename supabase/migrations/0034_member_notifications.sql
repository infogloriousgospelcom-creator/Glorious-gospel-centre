-- 0034 — Member notifications / Activity Center (Phase I-B8)
-- In-app inbox for congregants. MUST HAVE: Connect Group approve / decline /
-- remove notifications only. No email, Realtime, giving, leave, or re-request.
--
-- Creation: SECURITY DEFINER emit_member_notification — callable by trusted
-- membership RPCs only (EXECUTE revoked from anon/authenticated).
-- Mark-read: SECURITY DEFINER mark_member_notification_read for authenticated.
-- Recipient is always derived from membership.profile_id — never client input.

-- =====================================================================
-- 1. Table
-- =====================================================================

create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  source_type text not null,
  source_id uuid,
  event_key text not null,
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint member_notifications_kind_len
    check (char_length(kind) between 1 and 80),
  constraint member_notifications_title_len
    check (char_length(title) between 1 and 160),
  constraint member_notifications_body_len
    check (body is null or char_length(body) <= 500),
  constraint member_notifications_href_len
    check (href is null or char_length(href) between 1 and 200),
  constraint member_notifications_source_type_len
    check (char_length(source_type) between 1 and 80),
  constraint member_notifications_event_key_len
    check (char_length(event_key) between 1 and 80),
  constraint member_notifications_dedupe_key_len
    check (char_length(dedupe_key) between 1 and 240),
  -- Safe internal relative paths only (DB-enforced).
  -- Rejects schemes, protocol-relative, //, and /admin...
  constraint member_notifications_href_safe check (
    href is null
    or (
      href ~ '^/[a-zA-Z0-9][a-zA-Z0-9/_-]*$'
      and position(':' in href) = 0
      and position('//' in href) = 0
      and href !~* '^/admin(/|$)'
    )
  ),
  constraint member_notifications_dedupe_unique unique (dedupe_key)
);

create index if not exists idx_member_notifications_recipient_created
  on public.member_notifications (recipient_id, created_at desc);

create index if not exists idx_member_notifications_recipient_unread
  on public.member_notifications (recipient_id)
  where read_at is null;

comment on table public.member_notifications is
  'Congregant in-app notifications. Own-row SELECT; mark-read via RPC; emit via trusted SECURITY DEFINER helpers only.';

-- =====================================================================
-- 2. RLS + grants
-- =====================================================================

alter table public.member_notifications enable row level security;

drop policy if exists member_notifications_self_select on public.member_notifications;
create policy member_notifications_self_select on public.member_notifications
  for select to authenticated
  using (recipient_id = auth.uid());

-- No INSERT / UPDATE / DELETE policies for authenticated.
-- Mark-read uses mark_member_notification_read (SECURITY DEFINER).
-- Emit uses emit_member_notification (SECURITY DEFINER, table owner).

revoke all on table public.member_notifications from anon, authenticated;

grant select (
  id,
  recipient_id,
  kind,
  title,
  body,
  href,
  source_type,
  source_id,
  event_key,
  read_at,
  created_at
) on table public.member_notifications to authenticated;

-- Intentionally NOT granted to authenticated:
--   dedupe_key (internal)
--   INSERT / UPDATE / DELETE

comment on policy member_notifications_self_select on public.member_notifications is
  'Congregants may read only their own notifications (recipient_id = auth.uid()).';

-- =====================================================================
-- 3. emit_member_notification (trusted callers only)
-- =====================================================================

create or replace function public.emit_member_notification(
  p_recipient_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_href text,
  p_source_type text,
  p_source_id uuid,
  p_event_key text
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

  v_dedupe := p_recipient_id::text
    || ':' || btrim(p_source_type)
    || ':' || coalesce(p_source_id::text, 'none')
    || ':' || btrim(p_event_key);

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

  return v_id; -- null when duplicate (ON CONFLICT DO NOTHING)
end;
$$;

revoke all on function public.emit_member_notification(
  uuid, text, text, text, text, text, uuid, text
) from public;
revoke all on function public.emit_member_notification(
  uuid, text, text, text, text, text, uuid, text
) from anon;
revoke all on function public.emit_member_notification(
  uuid, text, text, text, text, text, uuid, text
) from authenticated;

comment on function public.emit_member_notification(
  uuid, text, text, text, text, text, uuid, text
) is
  'Trusted emit for member inbox. Idempotent on dedupe_key. No anon/authenticated EXECUTE.';

-- =====================================================================
-- 4. mark_member_notification_read
-- =====================================================================

create or replace function public.mark_member_notification_read(p_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n public.member_notifications;
begin
  if auth.uid() is null then
    raise exception 'member_notifications: authentication required'
      using errcode = '42501';
  end if;

  if p_notification_id is null then
    raise exception 'member_notifications: notification id required'
      using errcode = '22023';
  end if;

  select *
    into n
  from public.member_notifications
  where id = p_notification_id
  for update;

  if not found then
    return false;
  end if;

  if n.recipient_id is distinct from auth.uid() then
    raise exception 'member_notifications: permission denied'
      using errcode = '42501';
  end if;

  if n.read_at is not null then
    return true;
  end if;

  update public.member_notifications
  set read_at = now()
  where id = n.id
    and recipient_id = auth.uid();

  return true;
end;
$$;

revoke all on function public.mark_member_notification_read(uuid) from public;
revoke all on function public.mark_member_notification_read(uuid) from anon;
grant execute on function public.mark_member_notification_read(uuid) to authenticated;

comment on function public.mark_member_notification_read(uuid) is
  'Mark own notification read (read_at only). Ownership via auth.uid().';

-- =====================================================================
-- 5. Wire emit into moderation RPCs (approve / decline / remove)
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
    'connect_group.approved'
  );

  return m.id;
end;
$$;

revoke all on function public.approve_connect_group_membership(uuid, text) from public;
revoke all on function public.approve_connect_group_membership(uuid, text) from anon;
grant execute on function public.approve_connect_group_membership(uuid, text) to authenticated;

comment on function public.approve_connect_group_membership(uuid, text) is
  'Staff approve: PENDING → ACTIVE. Emits member notification. decided_by=auth.uid().';

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
    'connect_group.declined'
  );

  return m.id;
end;
$$;

revoke all on function public.decline_connect_group_membership(uuid, text) from public;
revoke all on function public.decline_connect_group_membership(uuid, text) from anon;
grant execute on function public.decline_connect_group_membership(uuid, text) to authenticated;

comment on function public.decline_connect_group_membership(uuid, text) is
  'Staff decline: PENDING → DECLINED. Emits member notification. decided_by=auth.uid().';

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
    'connect_group.removed'
  );

  return m.id;
end;
$$;

revoke all on function public.remove_connect_group_membership(uuid, text) from public;
revoke all on function public.remove_connect_group_membership(uuid, text) from anon;
grant execute on function public.remove_connect_group_membership(uuid, text) to authenticated;

comment on function public.remove_connect_group_membership(uuid, text) is
  'Staff remove: ACTIVE → REMOVED. Emits member notification. decided_by=auth.uid().';
