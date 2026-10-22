-- 0046 — Restrict storage uploads by content type.
-- The application validates uploads by magic bytes (lib/file-magic.ts), but the
-- Storage REST API is directly reachable with an admin's JWT, so the policy must
-- also constrain content type. Without this an admin could publish attacker-
-- controlled HTML/SVG on the project's own *.supabase.co origin.
--
-- Two-layer defense:
--   1. RLS policies (this migration): allowlist file extensions per bucket.
--   2. Bucket configuration (apply via Storage API or dashboard):
--      - allowed_mime_types: ['image/jpeg','image/png','image/webp','image/avif']
--      - file_size_limit: 5242880 (5 MiB)
--      Buckets: church-images, event-posters, leader-images, sermon-thumbnails,
--      gallery-images, media.
--      Note: 0010 is a placeholder; verify which buckets exist in the live DB.

-- ─── Public buckets: admin writes with extension allowlist ───────────────────
drop policy if exists "church-images_admin_write" on storage.objects;
create policy "church-images_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'church-images'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "event-posters_admin_write" on storage.objects;
create policy "event-posters_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-posters'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "leader-images_admin_write" on storage.objects;
create policy "leader-images_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'leader-images'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "sermon-thumbnails_admin_write" on storage.objects;
create policy "sermon-thumbnails_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'sermon-thumbnails'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "gallery-images_admin_write" on storage.objects;
create policy "gallery-images_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'gallery-images'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

-- ─── media bucket: admin-only writes with extension allowlist ─────────────────
drop policy if exists "media_admin_write" on storage.objects;
create policy "media_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

-- Also constrain updates to the same extension allowlist
drop policy if exists "church-images_admin_update" on storage.objects;
create policy "church-images_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'church-images'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "event-posters_admin_update" on storage.objects;
create policy "event-posters_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'event-posters'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "leader-images_admin_update" on storage.objects;
create policy "leader-images_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'leader-images'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "sermon-thumbnails_admin_update" on storage.objects;
create policy "sermon-thumbnails_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'sermon-thumbnails'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "gallery-images_admin_update" on storage.objects;
create policy "gallery-images_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'gallery-images'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );
