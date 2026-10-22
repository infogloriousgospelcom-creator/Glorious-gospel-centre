-- 0021 — Glorious Gospel Centre Church content population
--
-- Purpose:
--   Seed official church information supplied by the church questionnaire
--   (year 2000 onward). This migration only writes content that was explicitly
--   provided. Where information was not supplied, fields remain NULL / empty and
--   are flagged as PENDING in the report accompanying this migration.
--
-- Idempotent:
--   * Uses ON CONFLICT (slug) DO UPDATE for records that may exist already.
--   * Uses ON CONFLICT (slug) DO NOTHING for fully new records we are confident
--     do not yet exist.
--   * Uses ON CONFLICT ((true)) DO UPDATE for the singleton site_settings row.
--
-- What is NOT done here (per the task rules):
--   * No fake payment credentials, M-Pesa numbers, bank details.
--   * No invented social-media URLs.
--   * No invented email addresses or phone numbers.
--   * No fake upcoming events, sermons, leaders, or gallery media.
--   * No RLS changes, no role changes, no auth-table changes.

-- =====================================================================
-- 1. site_settings — official name, slogan, tagline reference, address,
--    office hours, established year, founder. Do NOT touch phone.
-- =====================================================================

update public.site_settings
set
  church_name = 'Glorious Gospel Centre Church',
  tagline = 'If God be for us, who can be against us? — Romans 8:31',
  address = 'Sizers–Kitengela, P.O. Box 396-00300, Nairobi',
  office_hours = '8:00 AM – 5:00 PM'
where id = (select id from public.site_settings limit 1);

-- If the singleton row does not exist, create it. (Defensive — the live DB
-- already has a row, but keep this safe for fresh environments.)
insert into public.site_settings (
  church_name,
  tagline,
  phone,
  address,
  office_hours
)
select
  'Glorious Gospel Centre Church',
  'If God be for us, who can be against us? — Romans 8:31',
  '+254729296296 / +254728296296',
  'Sizers–Kitengela, P.O. Box 396-00300, Nairobi',
  '8:00 AM – 5:00 PM'
where not exists (select 1 from public.site_settings);

-- =====================================================================
-- 2. social_links — record platforms but leave URLs PENDING.
--    active=false so they are not advertised until URLs are supplied.
-- =====================================================================

insert into public.social_links (platform, url, sort_order, is_active)
values
  ('facebook', '', 1, false),
  ('youtube',  '', 2, false),
  ('tiktok',   '', 3, false)
on conflict (platform) do update
  set url = case
    when excluded.url = '' then public.social_links.url
    else excluded.url
  end,
  is_active = public.social_links.is_active;

-- =====================================================================
-- 3. ministries — enrich the 9 existing records with the supplied data.
--    Existing short_description is preserved where richer than the supplied
--    info. Description, meeting_info, and image are only filled where the
--    questionnaire supplied data.
-- =====================================================================

-- Children's Ministry (slug: children)
update public.ministries
set
  name = 'Children''s Ministry',
  description = 'Sunday School. It is divided into two: Adult Sunday School and Children''s Sunday School.',
  meeting_info = 'Saturdays at the church (specific time to be confirmed by ministry leader).',
  contact_phone = null,
  contact_email = null,
  updated_at = now()
where slug = 'children';

-- Youth Ministry (slug: youth)
update public.ministries
set
  name = 'Youth Ministry',
  description = 'To promote fellowship and services among the young people.',
  meeting_info = 'Sundays (specific time and location to be confirmed by ministry leader).',
  updated_at = now()
where slug = 'youth';

-- Men's Ministry (slug: men)
update public.ministries
set
  name = 'Men''s Ministry',
  description = 'To cater for the spiritual and physical welfare of the mature men in the church.',
  meeting_info = null,
  updated_at = now()
where slug = 'men';

-- Women / Worship / Prayer / Evangelism & Outreach / Missions / Media
-- — questionnaire supplied only a name and no description, leader, or meeting
--   information, so these rows are left with their existing description and a
--   PENDING marker in meeting_info so the public site does not invent content.
update public.ministries
set
  meeting_info = 'PENDING — to be supplied by the ministry leader.',
  updated_at = now()
where slug in ('women', 'worship', 'prayer', 'evangelism-outreach', 'missions', 'media');

-- =====================================================================
-- 4. leaders — insert the three supplied leaders. Bios and ministry
--    responsibilities are PENDING.
-- =====================================================================

-- The leaders table has no UNIQUE constraint on full_name, so we use a
-- NOT EXISTS guard inside a DO block to keep the inserts idempotent without
-- altering schema.
do $$
begin
  if not exists (select 1 from public.leaders where full_name = 'Boniface Mangeti') then
    insert into public.leaders (full_name, title, bio, sort_order, is_featured, status)
    values ('Boniface Mangeti', 'Chairman',  'PENDING — biography to be provided by the church.', 1, true, 'PUBLISHED');
  end if;
  if not exists (select 1 from public.leaders where full_name = 'Faith Mangeti') then
    insert into public.leaders (full_name, title, bio, sort_order, is_featured, status)
    values ('Faith Mangeti', 'Secretary', 'PENDING — biography to be provided by the church.', 2, true, 'PUBLISHED');
  end if;
  if not exists (select 1 from public.leaders where full_name = 'Agripina Shiboko') then
    insert into public.leaders (full_name, title, bio, sort_order, is_featured, status)
    values ('Agripina Shiboko', 'Treasurer', 'PENDING — biography to be provided by the church.', 3, true, 'PUBLISHED');
  end if;
end$$;

-- =====================================================================
-- 5. ministry_leaders — link supplied leaders to their ministries.
--    The questionnaire supplied these ministry leader names:
--      Children's: Linet Chesoli
--      Youth:      Cynthia Nanjala
--      Men's:      Edward Wanyama
--    Each will be created as a real leaders row (status PUBLISHED, bio
--    PENDING) so the ministry_leaders.leader_id FK resolves cleanly.
-- =====================================================================

do $$
declare
  v_children     uuid;
  v_youth        uuid;
  v_men          uuid;
  v_linet        uuid;
  v_cynthia      uuid;
  v_edward       uuid;
begin
  select id into v_children from public.ministries where slug = 'children';
  select id into v_youth    from public.ministries where slug = 'youth';
  select id into v_men      from public.ministries where slug = 'men';

  -- Create the three ministry leaders if they don't already exist.
  if not exists (select 1 from public.leaders where full_name = 'Linet Chesoli') then
    insert into public.leaders (full_name, title, bio, sort_order, is_featured, status)
    values ('Linet Chesoli', 'Ministry Leader', 'PENDING — biography to be provided.', 50, false, 'PUBLISHED');
  end if;
  select id into v_linet from public.leaders where full_name = 'Linet Chesoli' limit 1;

  if not exists (select 1 from public.leaders where full_name = 'Cynthia Nanjala') then
    insert into public.leaders (full_name, title, bio, sort_order, is_featured, status)
    values ('Cynthia Nanjala', 'Ministry Leader', 'PENDING — biography to be provided.', 51, false, 'PUBLISHED');
  end if;
  select id into v_cynthia from public.leaders where full_name = 'Cynthia Nanjala' limit 1;

  if not exists (select 1 from public.leaders where full_name = 'Edward Wanyama') then
    insert into public.leaders (full_name, title, bio, sort_order, is_featured, status)
    values ('Edward Wanyama', 'Ministry Leader', 'PENDING — biography to be provided.', 52, false, 'PUBLISHED');
  end if;
  select id into v_edward from public.leaders where full_name = 'Edward Wanyama' limit 1;

  -- Link the leaders to their ministries.
  if v_children is not null and v_linet is not null and not exists (
    select 1 from public.ministry_leaders
    where ministry_id = v_children and leader_id = v_linet
  ) then
    insert into public.ministry_leaders (ministry_id, leader_id, role, sort_order)
    values (v_children, v_linet, 'Ministry Leader', 1);
  end if;

  if v_youth is not null and v_cynthia is not null and not exists (
    select 1 from public.ministry_leaders
    where ministry_id = v_youth and leader_id = v_cynthia
  ) then
    insert into public.ministry_leaders (ministry_id, leader_id, role, sort_order)
    values (v_youth, v_cynthia, 'Ministry Leader', 1);
  end if;

  if v_men is not null and v_edward is not null and not exists (
    select 1 from public.ministry_leaders
    where ministry_id = v_men and leader_id = v_edward
  ) then
    insert into public.ministry_leaders (ministry_id, leader_id, role, sort_order)
    values (v_men, v_edward, 'Ministry Leader', 1);
  end if;
end$$;

-- =====================================================================
-- 6. services — insert the six weekly services supplied (no Sunday service).
--    day_of_week values use PostgreSQL convention: 0 = Sunday, 1 = Monday,
--    ..., 6 = Saturday. The query layer maps these to day names.
-- =====================================================================

do $$
begin
  if not exists (select 1 from public.services where name = 'Leaders Meeting' and day_of_week = 1) then
    insert into public.services (name, description, day_of_week, start_time, end_time, location, is_recurring, sort_order, status)
    values ('Leaders Meeting', null, 1, '18:00', '19:00', 'At the church', true, 1, 'PUBLISHED');
  end if;
  if not exists (select 1 from public.services where name = 'Choir Practice' and day_of_week = 2) then
    insert into public.services (name, description, day_of_week, start_time, end_time, location, is_recurring, sort_order, status)
    values ('Choir Practice', null, 2, '18:00', '19:00', 'At the church', true, 2, 'PUBLISHED');
  end if;
  if not exists (select 1 from public.services where name = 'Intercessory' and day_of_week = 3) then
    insert into public.services (name, description, day_of_week, start_time, end_time, location, is_recurring, sort_order, status)
    values ('Intercessory', null, 3, '18:00', '19:00', 'At the church', true, 3, 'PUBLISHED');
  end if;
  if not exists (select 1 from public.services where name = 'Praise and Worship Practice' and day_of_week = 4) then
    insert into public.services (name, description, day_of_week, start_time, end_time, location, is_recurring, sort_order, status)
    values ('Praise and Worship Practice', null, 4, '18:00', '19:00', 'At the church', true, 4, 'PUBLISHED');
  end if;
  if not exists (select 1 from public.services where name = 'Intercessory' and day_of_week = 5) then
    insert into public.services (name, description, day_of_week, start_time, end_time, location, is_recurring, sort_order, status)
    values ('Intercessory', null, 5, '18:00', '19:00', 'At the church', true, 5, 'PUBLISHED');
  end if;
  if not exists (select 1 from public.services where name = 'Praise and Worship / Choir Practice' and day_of_week = 6) then
    insert into public.services (name, description, day_of_week, start_time, end_time, location, is_recurring, sort_order, status)
    values ('Praise and Worship / Choir Practice', null, 6, '15:00', '19:00', 'At the church', true, 6, 'PUBLISHED');
  end if;
end$$;

-- =====================================================================
-- 7. pages — create CMS pages with the supplied content.
--    All pages are inserted with status PUBLISHED so the public site can
--    render them, but content is restricted to what was supplied. PENDING
--    markers remain for fields not supplied.
-- =====================================================================

-- about-story — church history (preserve supplied wording, light cleanup only)
insert into public.pages (slug, title, excerpt, body, status, seo_title, seo_description)
values (
  'about-story',
  'Our Story',
  'How God brought Glorious Gospel Centre Church into being.',
  'Glorious Gospel Centre Church was established in the year 2000 by Bishop Dr. Boniface Mangeti.

The church began in a humble way with seven members in Mkuru Kwa Njenga slum, Nairobi.

The purpose of the church was to reach the Mkuru people with the Word of God, and today it has gone nationally and internationally. Glory be to God.',
  'PUBLISHED',
  'Our Story · Glorious Gospel Centre Church',
  'How Glorious Gospel Centre Church began in Mkuru Kwa Njenga and grew nationally and internationally.'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  status = excluded.status,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  updated_at = now();

-- about-vision-mission
insert into public.pages (slug, title, excerpt, body, status, seo_title, seo_description)
values (
  'about-vision-mission',
  'Vision & Mission',
  'Our vision, mission, and core values.',
  'Vision
To reach the world with the Gospel of Jesus Christ and baptising them in the name of the Father.

Mission
To instruct and strengthen church members in the faith and in holy living.

Core Values
Faith, Love, Integrity, Prayer, Unity, Service, Evangelism, Excellence, Discipleship, Generosity.',
  'PUBLISHED',
  'Vision & Mission · Glorious Gospel Centre Church',
  'The vision, mission, and core values of Glorious Gospel Centre Church.'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  status = excluded.status,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  updated_at = now();

-- about-statement-of-faith (supplied statements only — no additions)
insert into public.pages (slug, title, excerpt, body, status, seo_title, seo_description)
values (
  'about-statement-of-faith',
  'Statement of Faith',
  'What we believe as a church.',
  'We believe:

* In the believers'' baptism in water by immersion.
* The supreme mission of every church is to glorify God.
* In evangelism to touch nations with the Gospel and in discipleship.
* In the true church whose head is the Lord Jesus Christ.
* In the necessity of new birth as the work of God the Holy Spirit.',
  'PUBLISHED',
  'Statement of Faith · Glorious Gospel Centre Church',
  'The official statement of faith of Glorious Gospel Centre Church.'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  status = excluded.status,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  updated_at = now();

-- contact-info — contact content used by the Contact page if the page reads
-- from site_settings, this row is informational only. Keep DRAFT until a real
-- Contact page reads from pages.contact-info (currently it doesn't — see
-- TECHNICAL ISSUES in the report).
insert into public.pages (slug, title, excerpt, body, status)
values (
  'contact-info',
  'Contact',
  'How to reach Glorious Gospel Centre Church.',
  'Phone: +254729296296 / +254728296296

Physical address: Sizers–Kitengela

Postal address: P.O. Box 396-00300, Nairobi

Office hours: 8:00 AM – 5:00 PM

Email: PENDING — to be supplied by the church.

Google Maps: PENDING — to be supplied by the church.

WhatsApp: PENDING — to be supplied by the church.

Social media: PENDING — to be supplied by the church.',
  'DRAFT'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  updated_at = now();

-- orphans — content placeholder only. Status DRAFT until the church
-- approves real content.
insert into public.pages (slug, title, excerpt, body, status)
values (
  'orphans',
  'Orphans Ministry',
  'Caring for vulnerable children in our community.',
  'PENDING — content to be supplied by the church.

We will not invent names, numbers, locations, beneficiaries, donation claims, or financial information.',
  'DRAFT'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  updated_at = now();

-- feeding — content placeholder only. Status DRAFT until approved.
insert into public.pages (slug, title, excerpt, body, status)
values (
  'feeding',
  'Feeding Programme',
  'Providing meals and care to those in need.',
  'PENDING — content to be supplied by the church.

We will not invent beneficiaries, numbers, schedules, costs, locations, or claims about impact.',
  'DRAFT'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  updated_at = now();

-- =====================================================================
-- 8. Remove obvious test / placeholder rows from announcements, events,
--    and sermons so they do not appear on the public website. These rows
--    are clearly labelled as tests and were created for CRUD verification.
-- =====================================================================

delete from public.announcements where title = 'Admin-Test Announcement';

delete from public.events where title = 'admin test event';

delete from public.sermons where title = 'A sermon Test';