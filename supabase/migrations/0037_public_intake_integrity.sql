-- 0037 — Public Intake Integrity (Phase M)
-- Guest intake remains anonymous. Staff mutations are permission-gated.
-- No member ownership. No anon INSERT/UPDATE/DELETE grants.
-- Capacity enforcement is deferred (count-then-insert is not race-safe).

-- =====================================================================
-- 1. Contact — staff UPDATE/DELETE behind contact.manage
-- =====================================================================

drop policy if exists contact_messages_admin_update on public.contact_messages;
create policy contact_messages_admin_update on public.contact_messages
  for update to authenticated
  using (public.has_permission('contact.manage'))
  with check (public.has_permission('contact.manage'));

drop policy if exists contact_messages_admin_delete on public.contact_messages;
create policy contact_messages_admin_delete on public.contact_messages
  for delete to authenticated
  using (public.has_permission('contact.manage'));

-- =====================================================================
-- 2. Prayer — staff DELETE behind prayer.manage (anonymous intake unchanged)
-- =====================================================================

drop policy if exists prayer_requests_admin_delete on public.prayer_requests;
create policy prayer_requests_admin_delete on public.prayer_requests
  for delete to authenticated
  using (public.has_permission('prayer.manage'));

-- =====================================================================
-- 3. Least-privilege grants
--    Revoke table defaults from anon/authenticated, then grant only the
--    columns staff session clients already select/update. RLS still applies.
--    ip_hash is never granted. Anon receives no table grants.
--    Guest INSERT remains service-role only (0025).
-- =====================================================================

revoke all on table public.contact_messages from anon, authenticated;
revoke all on table public.prayer_requests from anon, authenticated;
revoke all on table public.event_registrations from anon, authenticated;

grant select (
  id,
  full_name,
  email,
  phone,
  subject,
  message,
  is_read,
  created_at
) on table public.contact_messages to authenticated;

grant update (is_read) on table public.contact_messages to authenticated;
grant delete on table public.contact_messages to authenticated;

grant select (
  id,
  full_name,
  email,
  phone,
  request_text,
  is_confidential,
  status,
  assigned_to,
  internal_notes,
  created_at,
  updated_at
) on table public.prayer_requests to authenticated;

grant update (
  status,
  assigned_to,
  internal_notes
) on table public.prayer_requests to authenticated;

grant delete on table public.prayer_requests to authenticated;

grant select (
  id,
  event_id,
  full_name,
  email,
  phone,
  notes,
  created_at
) on table public.event_registrations to authenticated;

-- Intentionally NOT granted to anon or authenticated:
--   contact_messages.ip_hash
--   prayer_requests.ip_hash
--   INSERT on any of these three tables
--   UPDATE/DELETE on event_registrations
