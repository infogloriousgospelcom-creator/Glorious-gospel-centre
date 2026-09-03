-- 0013 — Role seeds (idempotent)

insert into public.roles (key, label, description) values
  ('SUPER_ADMIN', 'Super Administrator', 'Full access including user management and final content approval'),
  ('ADMIN', 'Administrator', 'Manage content, events, sermons, gallery, and ministries'),
  ('EDITOR', 'Editor', 'Create and edit content (subject to approval workflow)'),
  ('PRAYER_MINISTER', 'Prayer Minister', 'Access confidential prayer requests'),
  ('MEDIA_MANAGER', 'Media Manager', 'Manage sermons, gallery, and all media')
on conflict (key) do nothing;

-- Assign permissions to roles.
do $$
declare
  r_super uuid;
  r_admin uuid;
  r_editor uuid;
  r_prayer uuid;
  r_media uuid;
begin
  select id into r_super   from public.roles where key = 'SUPER_ADMIN';
  select id into r_admin   from public.roles where key = 'ADMIN';
  select id into r_editor  from public.roles where key = 'EDITOR';
  select id into r_prayer  from public.roles where key = 'PRAYER_MINISTER';
  select id into r_media   from public.roles where key = 'MEDIA_MANAGER';

  insert into public.role_permissions (role_id, permission_id)
  select r_super, p.id from public.permissions p
  on conflict do nothing;

  insert into public.role_permissions (role_id, permission_id)
  select r_admin, p.id from public.permissions p
  where p.key in (
    'settings.manage','content.manage','media.manage',
    'events.manage','giving.manage','contact.manage','newsletter.manage'
  )
  on conflict do nothing;

  insert into public.role_permissions (role_id, permission_id)
  select r_editor, p.id from public.permissions p
  where p.key in ('content.manage')
  on conflict do nothing;

  insert into public.role_permissions (role_id, permission_id)
  select r_prayer, p.id from public.permissions p
  where p.key in ('prayer.manage','content.manage')
  on conflict do nothing;

  insert into public.role_permissions (role_id, permission_id)
  select r_media, p.id from public.permissions p
  where p.key in ('media.manage','content.manage')
  on conflict do nothing;
end$$;
