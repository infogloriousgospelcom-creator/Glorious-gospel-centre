-- 0026 — Stories of Grace (testimonies)
-- Moderated public testimony system.
-- Submissions: service-role insert only (no public INSERT policy).
-- Public: SELECT of safe columns only when status = APPROVED.
-- Admin: full access with testimonies.manage permission.

-- =====================================================================
-- 1. Enum
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'testimony_status') then
    create type public.testimony_status as enum (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'ARCHIVED'
    );
  end if;
end$$;

-- =====================================================================
-- 2. Table
-- =====================================================================

create table if not exists public.testimonies (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  story text not null,
  display_name text,
  anonymous boolean not null default false,
  submitter_email text,
  submitter_phone text,
  consent_to_publish boolean not null,
  consent_at timestamptz not null,
  status public.testimony_status not null default 'PENDING',
  internal_notes text,
  ip_hash text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonies_consent_required check (consent_to_publish = true),
  constraint testimonies_title_len check (char_length(title) between 3 and 160),
  constraint testimonies_story_len check (char_length(story) between 40 and 8000)
);

create index if not exists idx_testimonies_status on public.testimonies(status);
create index if not exists idx_testimonies_published_at on public.testimonies(published_at desc nulls last);
create index if not exists idx_testimonies_created_at on public.testimonies(created_at desc);
create unique index if not exists idx_testimonies_slug_unique
  on public.testimonies(slug)
  where slug is not null;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_testimonies') then
    create trigger set_updated_at_testimonies before update on public.testimonies
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;

-- =====================================================================
-- 3. Permission + role grants
-- =====================================================================

insert into public.permissions (key, description) values
  ('testimonies.manage', 'Review and moderate Stories of Grace testimony submissions')
on conflict (key) do nothing;

do $$
declare
  r_super uuid;
  r_admin uuid;
  p_id uuid;
begin
  select id into r_super from public.roles where key = 'SUPER_ADMIN';
  select id into r_admin from public.roles where key = 'ADMIN';
  select id into p_id from public.permissions where key = 'testimonies.manage';

  if p_id is not null and r_super is not null then
    insert into public.role_permissions (role_id, permission_id)
    values (r_super, p_id)
    on conflict do nothing;
  end if;

  if p_id is not null and r_admin is not null then
    insert into public.role_permissions (role_id, permission_id)
    values (r_admin, p_id)
    on conflict do nothing;
  end if;
end$$;

-- =====================================================================
-- 4. RLS
-- =====================================================================

alter table public.testimonies enable row level security;

-- No public INSERT — submissions go through service-role server actions.
drop policy if exists testimonies_public_insert on public.testimonies;

-- Public / authenticated may only read APPROVED + published rows.
drop policy if exists testimonies_public_select_approved on public.testimonies;
create policy testimonies_public_select_approved on public.testimonies
  for select to anon, authenticated
  using (
    status = 'APPROVED'::public.testimony_status
    and published_at is not null
  );

-- Column-level grants: hide private submission fields from anon/authenticated.
-- Admin private reads use the service-role client after a permission check.
revoke all on table public.testimonies from anon, authenticated;
grant select (
  id,
  slug,
  title,
  story,
  display_name,
  anonymous,
  status,
  published_at,
  created_at,
  updated_at
) on table public.testimonies to anon, authenticated;

-- Moderators with testimonies.manage: full row access (RLS).
drop policy if exists testimonies_admin_select on public.testimonies;
create policy testimonies_admin_select on public.testimonies
  for select to authenticated
  using (public.has_permission('testimonies.manage'));

drop policy if exists testimonies_admin_update on public.testimonies;
create policy testimonies_admin_update on public.testimonies
  for update to authenticated
  using (public.has_permission('testimonies.manage'))
  with check (public.has_permission('testimonies.manage'));

drop policy if exists testimonies_admin_delete on public.testimonies;
create policy testimonies_admin_delete on public.testimonies
  for delete to authenticated
  using (public.has_permission('testimonies.manage'));

-- Updates/deletes for authorized moderators (RLS still enforces permission).
-- Full-row SELECT for moderators is performed via service-role after permission check.
grant update, delete on table public.testimonies to authenticated;
