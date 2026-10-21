-- 0040 — gallery_items had RLS enabled (0009:20) but NO policy of any kind.
--
-- Consequences, both of which are live bugs:
--   1. The public gallery rendered empty — every anon/authenticated read of
--      gallery_items returned zero rows (services/gallery.ts:96-98 and
--      services/content.ts:395).
--   2. The ADMIN gallery was equally broken — services/admin/gallery.ts uses
--      the session client (not the service-role client) for its insert and
--      delete, so adding and removing photos failed, and
--      services/admin/gallery.read.ts could not read items in draft albums.
--
-- The policies below mirror the house pattern that 0009 already applies to
-- gallery_albums (0009_rls_policies.sql:207-216).

-- Public read: an item is visible exactly when its album is visible, so the
-- item policy and the album policy can never disagree.
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

-- Admin read of any album, published or not.
drop policy if exists gallery_items_admin_select on public.gallery_items;
create policy gallery_items_admin_select on public.gallery_items
  for select to authenticated
  using (public.has_permission('media.manage'));

-- Admin write.
drop policy if exists gallery_items_admin_write on public.gallery_items;
create policy gallery_items_admin_write on public.gallery_items
  for all to authenticated
  using (public.has_permission('media.manage'))
  with check (public.has_permission('media.manage'));

-- Column grants. The public roles see only the columns the public UI renders;
-- uploaded_by is a staff-only audit column and stays hidden from anon.
revoke all on table public.gallery_items from anon, authenticated;
grant select (id, album_id, storage_path, caption, alt_text, sort_order, created_at)
  on table public.gallery_items to anon, authenticated;

-- INSERT privilege is required on every column the client names, so
-- uploaded_by must be granted even though the trigger below overwrites it.
-- This is the same pattern as ministry_serve_interests in 0036, which grants
-- insert on profile_id and lets a BEFORE INSERT trigger overwrite it.
-- No UPDATE grant: the app has no update path for gallery items (it inserts
-- and deletes only). DELETE is granted because staff remove photos.
grant insert (album_id, storage_path, caption, alt_text, sort_order, uploaded_by) on table public.gallery_items to authenticated;
grant delete on table public.gallery_items to authenticated;

-- uploaded_by is set by the database, never by the client. This mirrors the
-- pattern already used for ministry_serve_interests in 0036.
create or replace function public.tg_gallery_items_guard_uploaded_by()
returns trigger
language plpgsql
as $$
begin
  new.uploaded_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists gallery_items_guard_uploaded_by on public.gallery_items;
create trigger gallery_items_guard_uploaded_by
  before insert on public.gallery_items
  for each row execute function public.tg_gallery_items_guard_uploaded_by();
