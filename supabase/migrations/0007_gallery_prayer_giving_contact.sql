-- 0007 — Gallery, prayer, giving, contact, newsletter

create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  cover_image text,
  category text,
  event_date date,
  sort_order int not null default 0,
  status public.content_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gallery_albums_status on public.gallery_albums(status);
create index if not exists idx_gallery_albums_slug on public.gallery_albums(slug);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums(id) on delete cascade,
  storage_path text not null,
  caption text,
  alt_text text,
  sort_order int not null default 0,
  width int,
  height int,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_items_album on public.gallery_items(album_id);

-- Prayer requests are confidential. No public reads.
create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  request_text text not null,
  is_confidential boolean not null default true,
  status public.prayer_status not null default 'NEW',
  assigned_to uuid references public.profiles(id),
  internal_notes text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prayer_status on public.prayer_requests(status);
create index if not exists idx_prayer_created on public.prayer_requests(created_at desc);

create table if not exists public.giving_categories (
  id uuid primary key default gen_random_uuid(),
  kind public.giving_category_kind not null,
  label text not null,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, label)
);

create table if not exists public.giving_transactions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.giving_categories(id) on delete set null,
  provider text not null,
  external_reference text,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'KES',
  phone text,
  status public.giving_tx_status not null default 'PENDING',
  raw_callback jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_giving_tx_external_ref
  on public.giving_transactions(provider, external_reference)
  where external_reference is not null;

create index if not exists idx_giving_tx_status on public.giving_transactions(status);
create index if not exists idx_giving_tx_created on public.giving_transactions(created_at desc);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_created on public.contact_messages(created_at desc);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  is_confirmed boolean not null default false,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  ip_hash text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_gallery_albums') then
    create trigger set_updated_at_gallery_albums before update on public.gallery_albums
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_prayer_requests') then
    create trigger set_updated_at_prayer_requests before update on public.prayer_requests
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_giving_categories') then
    create trigger set_updated_at_giving_categories before update on public.giving_categories
      for each row execute function public.tg_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_giving_transactions') then
    create trigger set_updated_at_giving_transactions before update on public.giving_transactions
      for each row execute function public.tg_set_updated_at();
  end if;
end$$;
