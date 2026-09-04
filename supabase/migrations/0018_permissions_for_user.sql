-- 0018 — permissions_for_user helper
-- Returns all permission keys a given auth user has, by walking
-- public.admins → public.role_permissions → public.permissions.
-- Marked SECURITY DEFINER so RLS doesn't block the lookup; the function
-- only reads from tables the caller could query directly anyway.

create or replace function public.permissions_for_user(p_user_id uuid)
returns table (key text)
language sql
stable
security definer
set search_path = public
as $$
  select p.key
  from public.permissions p
  join public.role_permissions rp on rp.permission_id = p.id
  join public.admins a on a.role_id = rp.role_id
  where a.profile_id = p_user_id
    and a.is_active = true;
$$;

revoke all on function public.permissions_for_user(uuid) from public;
grant execute on function public.permissions_for_user(uuid) to authenticated;
