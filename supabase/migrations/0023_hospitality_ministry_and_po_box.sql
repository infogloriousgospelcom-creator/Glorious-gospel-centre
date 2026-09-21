-- 0023 — Hospitality Ministry + parent_id support + P.O. Box update
--
-- Purpose:
--   1. Add parent_id self-referencing FK to ministries for parent/child relationships
--   2. Seed Hospitality Ministry with two child ministries (Orphans/Vulnerables, Feeding Programme)
--   3. Update the church P.O. Box to the new value
--
-- Idempotent:
--   Uses ON CONFLICT (slug) DO NOTHING for new ministry inserts.
--   Uses conditional updates for site_settings and pages.

-- =====================================================================
-- 1. Add parent_id to ministries table for parent/child relationships
-- =====================================================================

alter table public.ministries
  add column if not exists parent_id uuid references public.ministries(id) on delete set null;

create index if not exists idx_ministries_parent_id on public.ministries(parent_id);

-- =====================================================================
-- 2. Seed Hospitality Ministry and its two child ministries
-- =====================================================================

-- Parent: Hospitality Ministry
insert into public.ministries (slug, name, short_description, description, meeting_info, sort_order, status)
values (
  'hospitality',
  'Hospitality Ministry',
  'Serving vulnerable people in our community through compassionate care and support.',
  'The Hospitality Ministry is dedicated to serving the most vulnerable members of our community. Through our two key programmes — Orphans/Vulnerables support and the Feeding Programme — we extend the love of Christ to those in need, providing practical care, hope, and dignity.',
  'PENDING — to be supplied by the ministry leader.',
  10,
  'PUBLISHED'
)
on conflict (slug) do nothing;

-- Child: Orphans/Vulnerables
insert into public.ministries (slug, name, short_description, description, meeting_info, sort_order, status, parent_id)
select
  'orphans-vulnerables',
  'Orphans/Vulnerables',
  'Supporting orphaned and vulnerable children with care, resources, and hope.',
  'PENDING — content to be supplied by the ministry leader.',
  'PENDING — to be supplied by the ministry leader.',
  11,
  'PUBLISHED',
  m.id
from public.ministries m
where m.slug = 'hospitality'
on conflict (slug) do nothing;

-- Child: Feeding Programme
insert into public.ministries (slug, name, short_description, description, meeting_info, sort_order, status, parent_id)
select
  'feeding-programme',
  'Feeding Programme',
  'Providing meals and nutritional support to those in need in our community.',
  'PENDING — content to be supplied by the ministry leader.',
  'PENDING — to be supplied by the ministry leader.',
  12,
  'PUBLISHED',
  m.id
from public.ministries m
where m.slug = 'hospitality'
on conflict (slug) do nothing;

-- =====================================================================
-- 3. Update P.O. Box to P.O. Box 8074-00200, Nairobi
-- =====================================================================

-- Update site_settings
update public.site_settings
set
  address = 'Sizers–Kitengela, P.O. Box 8074-00200, Nairobi',
  updated_at = now()
where address like '%P.O. Box 396-00300%';

-- Update contact-info page body
update public.pages
set
  body = replace(body, 'P.O. Box 396-00300, Nairobi', 'P.O. Box 8074-00200, Nairobi'),
  updated_at = now()
where slug = 'contact-info'
  and body like '%P.O. Box 396-00300%';
