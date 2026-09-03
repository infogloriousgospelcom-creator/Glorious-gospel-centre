-- 0002 — Roles, permissions, profiles, admins
-- Authorization model.

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create index if not exists idx_role_permissions_role on public.role_permissions(role_id);
create index if not exists idx_role_permissions_perm on public.role_permissions(permission_id);

-- Profiles are linked 1:1 to auth.users. They hold the public-safe user metadata.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admins link a profile to a role. A profile may be admin for many roles but
-- in practice one role is the norm; many-to-many allows flexibility.
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, role_id)
);

create index if not exists idx_admins_profile on public.admins(profile_id);
create index if not exists idx_admins_role on public.admins(role_id);

-- updated_at maintenance
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_roles') then
    create trigger set_updated_at_roles before update on public.roles
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_profiles') then
    create trigger set_updated_at_profiles before update on public.profiles
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_admins') then
    create trigger set_updated_at_admins before update on public.admins
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;
