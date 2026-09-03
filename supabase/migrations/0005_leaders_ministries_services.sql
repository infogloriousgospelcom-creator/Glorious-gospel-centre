-- 0005 — Leaders, ministries, services

create table if not exists public.leaders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text,
  bio text,
  image_url text,
  email text,
  phone text,
  sort_order int not null default 0,
  is_featured boolean not null default false,
  status public.content_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leaders_status on public.leaders(status);
create index if not exists idx_leaders_featured on public.leaders(is_featured);

create table if not exists public.ministries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_description text,
  description text,
  hero_image text,
  meeting_info text,
  contact_email text,
  contact_phone text,
  sort_order int not null default 0,
  status public.content_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ministries_status on public.ministries(status);
create index if not exists idx_ministries_slug on public.ministries(slug);

create table if not exists public.ministry_leaders (
  ministry_id uuid not null references public.ministries(id) on delete cascade,
  leader_id uuid not null references public.leaders(id) on delete restrict,
  role text,
  sort_order int not null default 0,
  primary key (ministry_id, leader_id)
);

create index if not exists idx_ministry_leaders_leader on public.ministry_leaders(leader_id);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time,
  location text,
  ministry_id uuid references public.ministries(id) on delete set null,
  sort_order int not null default 0,
  is_recurring boolean not null default true,
  status public.content_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_status on public.services(status);
create index if not exists idx_services_day on public.services(day_of_week);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_leaders') then
    create trigger set_updated_at_leaders before update on public.leaders
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_ministries') then
    create trigger set_updated_at_ministries before update on public.ministries
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_services') then
    create trigger set_updated_at_services before update on public.services
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;
