-- 0039 — Allow an admin to read their OWN admin row.
-- The admins table policy (0009:admins_admin_all) requires 'roles.manage',
-- which only SUPER_ADMIN holds. Without a self-read policy, ADMIN / EDITOR /
-- PRAYER_MINISTER / MEDIA_MANAGER cannot see their own role row, so
-- getCurrentAdmin() returns null and they are locked out of /admin.

drop policy if exists admins_self_select on public.admins;
create policy admins_self_select on public.admins
  for select to authenticated
  using (profile_id = auth.uid() and is_active = true);

-- Defence in depth: resolve role keys without depending on RLS.
-- Only returns the caller's own role keys unless the caller holds roles.manage.
create or replace function public.roles_for_user(p_user_id uuid)
returns table (key text)
language sql
stable
security definer
set search_path = public
as $$
  select r.key
  from public.admins a
  join public.roles r on r.id = a.role_id
  where a.profile_id = p_user_id and a.is_active = true
  and (p_user_id = auth.uid() or public.has_permission('roles.manage'));
$$;

revoke all on function public.roles_for_user(uuid) from public;
grant execute on function public.roles_for_user(uuid) to authenticated;
