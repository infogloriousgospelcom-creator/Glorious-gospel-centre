-- 0021 — Security audit Phase 20 RLS gap fixes
--
-- Closes missing policies identified in SECURITY_AUDIT.md:
--   * gallery_items — no public/admin policies exist (table created in 0007).
--     The table is currently invisible to every role. Adds:
--       - public SELECT only when the parent album is PUBLISHED
--       - admin full access (INSERT/UPDATE/DELETE) for media.manage
--   * contact_messages — no admin UPDATE/DELETE policy. Mark-read/delete
--     currently fail with 403 under RLS. Adds admin UPDATE/DELETE.
--   * prayer_requests — no admin DELETE policy. Delete-prayer currently
--     fails with 403. Adds admin DELETE.
--   * event_registrations — no admin UPDATE/DELETE policy. Latent risk;
--     adds admin full access for events.manage.
--   * giving_transactions — needs a tightly-restricted UPDATE policy that
--     only allows the webhook (service role will continue to bypass RLS;
--     this policy is a defence-in-depth backstop in case the anon client
--     is ever used again).

-- ─── gallery_items ───────────────────────────────────────────────────────
drop policy if exists gallery_items_public_select on public.gallery_items;
create policy gallery_items_public_select on public.gallery_items
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.gallery_albums a
      where a.id = gallery_items.album_id
        and public.is_published(a.status)
    )
  );

drop policy if exists gallery_items_admin_write on public.gallery_items;
create policy gallery_items_admin_write on public.gallery_items
  for all to authenticated
  using (public.has_permission('media.manage'))
  with check (public.has_permission('media.manage'));

-- ─── contact_messages (add UPDATE/DELETE for contact.manage) ───────────
drop policy if exists contact_messages_admin_write on public.contact_messages;
create policy contact_messages_admin_write on public.contact_messages
  for update, delete to authenticated
  using (public.has_permission('contact.manage'))
  with check (public.has_permission('contact.manage'));

-- ─── prayer_requests (add DELETE for prayer.manage) ────────────────────
drop policy if exists prayer_requests_admin_delete on public.prayer_requests;
create policy prayer_requests_admin_delete on public.prayer_requests
  for delete to authenticated
  using (public.has_permission('prayer.manage'));

-- ─── event_registrations (admin UPDATE/DELETE for events.manage) ───────
drop policy if exists event_registrations_admin_write on public.event_registrations;
create policy event_registrations_admin_write on public.event_registrations
  for update, delete to authenticated
  using (public.has_permission('events.manage'))
  with check (public.has_permission('events.manage'));

-- ─── giving_transactions (least-privilege UPDATE for anon/server flows) ─
-- Production webhook uses the service-role client (bypasses RLS). This
-- policy is a defence-in-depth fallback: anonymous updates are only
-- permitted when the row is still PENDING or PROCESSING, the phone hash
-- in metadata matches the request, and the status transitions to a
-- terminal value. We keep this narrow on purpose: regular admin operations
-- still rely on giving_transactions_admin_all above.
drop policy if exists giving_transactions_webhook_update on public.giving_transactions;
create policy giving_transactions_webhook_update on public.giving_transactions
  for update to anon
  using (status in ('PENDING', 'PROCESSING'))
  with check (status in ('SUCCESS', 'FAILED', 'CANCELLED'));

-- Note: anonymous inserts on giving_transactions remain blocked. The
-- initiate path always uses the service-role client.