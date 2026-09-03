-- 0004 — Site settings, social links, announcements, pages

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  church_name text not null default 'Glorious Gospel Centre',
  tagline text,
  phone text,
  email text,
  address text,
  office_hours text,
  google_maps_url text,
  whatsapp text,
  mpesa_paybill text,
  mpesa_till text,
  bank_instructions text,
  seo_default_title text,
  seo_default_description text,
  seo_default_og_image text,
  theme jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_site_settings_singleton on public.site_settings ((true));

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_pinned boolean not null default false,
  status public.content_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_announcements_status on public.announcements(status);
create index if not exists idx_announcements_starts on public.announcements(starts_at);

-- CMS pages (About, Our Story, Vision & Mission, Statement of Faith, etc.)
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text not null default '',
  hero_image text,
  status public.content_status not null default 'DRAFT',
  seo_title text,
  seo_description text,
  seo_og_image text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pages_slug on public.pages(slug);
create index if not exists idx_pages_status on public.pages(status);

-- Revision history for pages.
create table if not exists public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  title text not null,
  body text not null,
  excerpt text,
  status public.content_status not null,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_page_revisions_page on public.page_revisions(page_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_site_settings') then
    create trigger set_updated_at_site_settings before update on public.site_settings
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_social_links') then
    create trigger set_updated_at_social_links before update on public.social_links
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_announcements') then
    create trigger set_updated_at_announcements before update on public.announcements
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_pages') then
    create trigger set_updated_at_pages before update on public.pages
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;
