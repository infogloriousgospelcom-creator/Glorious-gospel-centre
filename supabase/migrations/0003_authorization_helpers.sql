-- 0003 — Authorization helpers
-- Reusable functions referenced by RLS policies.

-- Returns true if the current auth user has any admin role.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.profile_id = auth.uid()
      and a.is_active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Returns true if the current auth user holds a role by key.
create or replace function public.has_role(role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    join public.roles r on r.id = a.role_id
    where a.profile_id = auth.uid()
      and a.is_active = true
      and r.key = role_key
  );
$$;

revoke all on function public.has_role(text) from public;
grant execute on function public.has_role(text) to authenticated;

-- Returns true if the current auth user has a specific permission.
create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    join public.role_permissions rp on rp.role_id = a.role_id
    join public.permissions p on p.id = rp.permission_id
    where a.profile_id = auth.uid()
      and a.is_active = true
      and p.key = permission_key
  );
$$;

revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated;
