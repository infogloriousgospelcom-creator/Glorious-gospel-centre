-- 0016 — Initial ministry seeds
-- Inserts the 9 initial ministry categories from the approved questionnaire.
-- Idempotent: uses ON CONFLICT on slug.

insert into public.ministries (slug, name, short_description, description, meeting_info, sort_order, status)
values
  (
    'children',
    'Children',
    'Nurturing the next generation in the knowledge and love of Christ.',
    '[Detailed description to be provided by ministry leader via admin.]',
    '[Meeting day/time/location TBD]',
    1,
    'PUBLISHED'
  ),
  (
    'youth',
    'Youth',
    'Equipping young people to live for Jesus in their everyday lives.',
    '[Detailed description to be provided by ministry leader via admin.]',
    '[Meeting day/time/location TBD]',
    2,
    'PUBLISHED'
  ),
  (
    'women',
    'Women',
    'Encouraging women to grow in faith, family, and fellowship.',
    '[Detailed description to be provided by ministry leader via admin.]',
    '[Meeting day/time/location TBD]',
    3,
    'PUBLISHED'
  ),
  (
    'men',
    'Men',
    'Building men of integrity, leadership, and servant-hearted courage.',
    '[Detailed description to be provided by ministry leader via admin.]',
    '[Meeting day/time/location TBD]',
    4,
    'PUBLISHED'
  ),
  (
    'worship',
    'Worship',
    'Leading the church in joyful, Spirit-filled praise and worship.',
    '[Detailed description to be provided by ministry leader via admin.]',
    '[Meeting day/time/location TBD]',
    5,
    'PUBLISHED'
  ),
  (
    'prayer',
    'Prayer',
    'Standing together in persistent prayer for our church and city.',
    '[Detailed description to be provided by ministry leader via admin.]',
    '[Meeting day/time/location TBD]',
    6,
    'PUBLISHED'
  ),
  (
    'evangelism-outreach',
    'Evangelism & Outreach',
    'Sharing the Gospel in word and deed throughout our community.',
    '[Detailed description to be provided by ministry leader via admin.]',
    '[Meeting day/time/location TBD]',
    7,
    'PUBLISHED'
  ),
  (
    'missions',
    'Missions',
    'Supporting missionaries and gospel work beyond our local community.',
    '[Detailed description to be provided by ministry leader via admin.]',
    '[Meeting day/time/location TBD]',
    8,
    'PUBLISHED'
  ),
  (
    'media',
    'Media',
    'Using media and technology to extend the reach of the Gospel.',
    '[Detailed description to be provided by ministry leader via admin.]',
    '[Meeting day/time/location TBD]',
    9,
    'PUBLISHED'
  )
on conflict (slug) do nothing;
