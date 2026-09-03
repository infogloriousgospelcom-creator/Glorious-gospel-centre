-- 0012 — Permission seeds (idempotent)
-- These are referenced by RLS policies in 0009.

insert into public.permissions (key, description) values
  ('roles.manage', 'Manage roles, permissions, and admin assignments'),
  ('settings.manage', 'Manage site settings and social links'),
  ('content.manage', 'Manage pages, events, sermons, ministries, services, leaders, announcements'),
  ('media.manage', 'Manage gallery and all media uploads'),
  ('events.manage', 'View event registrations'),
  ('prayer.manage', 'View and triage prayer requests'),
  ('giving.manage', 'View and manage giving transactions'),
  ('contact.manage', 'View contact form submissions'),
  ('newsletter.manage', 'Manage newsletter subscribers'),
  ('audit.view', 'View audit logs')
on conflict (key) do nothing;
