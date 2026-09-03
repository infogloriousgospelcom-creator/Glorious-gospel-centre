-- 0011 — Storage object policies
-- Buckets (created via dashboard or mgmt API):
--   church-images, event-posters, leader-images, sermon-thumbnails, gallery-images  → public read
--   media                                                                          → admin read
--
-- Path convention: <bucket>/<entity>/<id>/<filename>
-- These policies restrict reads by path-prefix when applicable.

-- ─── Public buckets: read-only for anon+authenticated ───────────────────
drop policy if exists "church-images_public_read" on storage.objects;
create policy "church-images_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'church-images');

drop policy if exists "event-posters_public_read" on storage.objects;
create policy "event-posters_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'event-posters');

drop policy if exists "leader-images_public_read" on storage.objects;
create policy "leader-images_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'leader-images');

drop policy if exists "sermon-thumbnails_public_read" on storage.objects;
create policy "sermon-thumbnails_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'sermon-thumbnails');

drop policy if exists "gallery-images_public_read" on storage.objects;
create policy "gallery-images_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'gallery-images');

-- ─── Admin uploads to public buckets ─────────────────────────────────────
drop policy if exists "church-images_admin_write" on storage.objects;
create policy "church-images_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'church-images' and public.has_permission('media.manage'));

drop policy if exists "event-posters_admin_write" on storage.objects;
create policy "event-posters_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-posters' and public.has_permission('media.manage'));

drop policy if exists "leader-images_admin_write" on storage.objects;
create policy "leader-images_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'leader-images' and public.has_permission('media.manage'));

drop policy if exists "sermon-thumbnails_admin_write" on storage.objects;
create policy "sermon-thumbnails_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'sermon-thumbnails' and public.has_permission('media.manage'));

drop policy if exists "gallery-images_admin_write" on storage.objects;
create policy "gallery-images_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gallery-images' and public.has_permission('media.manage'));

drop policy if exists "church-images_admin_update" on storage.objects;
create policy "church-images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'church-images' and public.has_permission('media.manage'));

drop policy if exists "event-posters_admin_update" on storage.objects;
create policy "event-posters_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'event-posters' and public.has_permission('media.manage'));

drop policy if exists "leader-images_admin_update" on storage.objects;
create policy "leader-images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'leader-images' and public.has_permission('media.manage'));

drop policy if exists "sermon-thumbnails_admin_update" on storage.objects;
create policy "sermon-thumbnails_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'sermon-thumbnails' and public.has_permission('media.manage'));

drop policy if exists "gallery-images_admin_update" on storage.objects;
create policy "gallery-images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'gallery-images' and public.has_permission('media.manage'));

drop policy if exists "church-images_admin_delete" on storage.objects;
create policy "church-images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'church-images' and public.has_permission('media.manage'));

drop policy if exists "event-posters_admin_delete" on storage.objects;
create policy "event-posters_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-posters' and public.has_permission('media.manage'));

drop policy if exists "leader-images_admin_delete" on storage.objects;
create policy "leader-images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'leader-images' and public.has_permission('media.manage'));

drop policy if exists "sermon-thumbnails_admin_delete" on storage.objects;
create policy "sermon-thumbnails_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'sermon-thumbnails' and public.has_permission('media.manage'));

drop policy if exists "gallery-images_admin_delete" on storage.objects;
create policy "gallery-images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gallery-images' and public.has_permission('media.manage'));

-- ─── media bucket: admin-only ────────────────────────────────────────────
drop policy if exists media_admin_read on storage.objects;
create policy media_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.has_permission('media.manage'));

drop policy if exists media_admin_write on storage.objects;
create policy media_admin_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.has_permission('media.manage'));

drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.has_permission('media.manage'));

drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.has_permission('media.manage'));
