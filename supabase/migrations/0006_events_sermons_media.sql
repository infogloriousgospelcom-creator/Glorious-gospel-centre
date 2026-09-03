-- 0006 — Events, sermons, media

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text,
  description text,
  poster_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  speaker text,
  registration_required boolean not null default false,
  registration_url text,
  registration_capacity int,
  status public.content_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_starts on public.events(starts_at);
create index if not exists idx_events_slug on public.events(slug);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_reg_event on public.event_registrations(event_id);

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  speaker text,
  preached_on date not null,
  scripture text,
  category text,
  thumbnail_url text,
  video_url text,
  audio_url text,
  livestream_url text,
  duration_seconds int,
  status public.content_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sermons_status on public.sermons(status);
create index if not exists idx_sermons_preached on public.sermons(preached_on);
create index if not exists idx_sermons_speaker on public.sermons(speaker);
create index if not exists idx_sermons_slug on public.sermons(slug);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image','video','audio','document')),
  title text,
  description text,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  duration_seconds int,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_media_kind on public.media(kind);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_events') then
    create trigger set_updated_at_events before update on public.events
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_sermons') then
    create trigger set_updated_at_sermons before update on public.sermons
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;
