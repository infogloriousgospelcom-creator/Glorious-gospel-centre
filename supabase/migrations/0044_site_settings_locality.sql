-- 0044 — Local SEO fields for the Church schema.
alter table public.site_settings
  add column if not exists locality text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
