-- 0009 — Row Level Security (idempotent enable + policies)

-- Enable RLS on every public table.
do $$
declare
  t text;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'roles','permissions','role_permissions',
        'profiles','admins',
        'site_settings','social_links','announcements','pages','page_revisions',
        'leaders','ministries','ministry_leaders','services',
        'events','event_registrations','sermons','media',
        'gallery_albums','gallery_items',
        'prayer_requests','giving_categories','giving_transactions',
        'contact_messages','newsletter_subscribers','audit_logs'
      )
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end$$;

-- Helper: public read only when status = PUBLISHED.
create or replace function public.is_published(status public.content_status)
returns boolean
language sql
immutable
as $$
  select status = 'PUBLISHED'::public.content_status;
$$;

grant execute on function public.is_published(public.content_status) to anon, authenticated;

-- ─── Roles & permissions: admin only ─────────────────────────────────────
drop policy if exists roles_admin_all on public.roles;
create policy roles_admin_all on public.roles
  for all to authenticated
  using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

drop policy if exists permissions_admin_all on public.permissions;
create policy permissions_admin_all on public.permissions
  for all to authenticated
  using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

drop policy if exists role_permissions_admin_all on public.role_permissions;
create policy role_permissions_admin_all on public.role_permissions
  for all to authenticated
  using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

-- ─── Profiles: own row read/update; admins read all ──────────────────────
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (public.is_admin() or id = auth.uid());

-- Admins table: admins only.
drop policy if exists admins_admin_all on public.admins;
create policy admins_admin_all on public.admins
  for all to authenticated
  using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

-- ─── Site settings & social links: public read of safe fields, admin write
drop policy if exists site_settings_public_select on public.site_settings;
create policy site_settings_public_select on public.site_settings
  for select to anon, authenticated
  using (true);

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings
  for all to authenticated
  using (public.has_permission('settings.manage'))
  with check (public.has_permission('settings.manage'));

drop policy if exists social_links_public_select on public.social_links;
create policy social_links_public_select on public.social_links
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists social_links_admin_write on public.social_links;
create policy social_links_admin_write on public.social_links
  for all to authenticated
  using (public.has_permission('settings.manage'))
  with check (public.has_permission('settings.manage'));

-- ─── Announcements, pages, leaders, ministries, services, events, sermons,
--     gallery_albums: public SELECT only when PUBLISHED; admin write.
drop policy if exists announcements_public_select on public.announcements;
create policy announcements_public_select on public.announcements
  for select to anon, authenticated
  using (public.is_published(status));

drop policy if exists announcements_admin_write on public.announcements;
create policy announcements_admin_write on public.announcements
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

drop policy if exists pages_public_select on public.pages;
create policy pages_public_select on public.pages
  for select to anon, authenticated
  using (public.is_published(status));

drop policy if exists pages_admin_write on public.pages;
create policy pages_admin_write on public.pages
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

drop policy if exists page_revisions_admin_all on public.page_revisions;
create policy page_revisions_admin_all on public.page_revisions
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

drop policy if exists leaders_public_select on public.leaders;
create policy leaders_public_select on public.leaders
  for select to anon, authenticated
  using (public.is_published(status));

drop policy if exists leaders_admin_write on public.leaders;
create policy leaders_admin_write on public.leaders
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

drop policy if exists ministries_public_select on public.ministries;
create policy ministries_public_select on public.ministries
  for select to anon, authenticated
  using (public.is_published(status));

drop policy if exists ministries_admin_write on public.ministries;
create policy ministries_admin_write on public.ministries
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

drop policy if exists ministry_leaders_public_select on public.ministry_leaders;
create policy ministry_leaders_public_select on public.ministry_leaders
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.ministries m
      where m.id = ministry_id and public.is_published(m.status)
    )
  );

drop policy if exists ministry_leaders_admin_write on public.ministry_leaders;
create policy ministry_leaders_admin_write on public.ministry_leaders
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

drop policy if exists services_public_select on public.services;
create policy services_public_select on public.services
  for select to anon, authenticated
  using (public.is_published(status));

drop policy if exists services_admin_write on public.services;
create policy services_admin_write on public.services
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

drop policy if exists events_public_select on public.events;
create policy events_public_select on public.events
  for select to anon, authenticated
  using (public.is_published(status));

drop policy if exists events_admin_write on public.events;
create policy events_admin_write on public.events
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

drop policy if exists sermons_public_select on public.sermons;
create policy sermons_public_select on public.sermons
  for select to anon, authenticated
  using (public.is_published(status));

drop policy if exists sermons_admin_write on public.sermons;
create policy sermons_admin_write on public.sermons
  for all to authenticated
  using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

drop policy if exists gallery_albums_public_select on public.gallery_albums;
create policy gallery_albums_public_select on public.gallery_albums
  for select to anon, authenticated
  using (public.is_published(status));

drop policy if exists gallery_albums_admin_write on public.gallery_albums;
create policy gallery_albums_admin_write on public.gallery_albums
  for all to authenticated
  using (public.has_permission('media.manage'))
  with check (public.has_permission('media.manage'));

-- Media + gallery items have no public table — access via storage policies.

-- ─── Event registrations: anyone can insert; admin can read.
drop policy if exists event_registrations_public_insert on public.event_registrations;
create policy event_registrations_public_insert on public.event_registrations
  for insert to anon, authenticated
  with check (true);

drop policy if exists event_registrations_admin_select on public.event_registrations;
create policy event_registrations_admin_select on public.event_registrations
  for select to authenticated
  using (public.has_permission('events.manage'));

-- ─── Prayer requests: confidential. Public insert only; admin select.
drop policy if exists prayer_requests_public_insert on public.prayer_requests;
create policy prayer_requests_public_insert on public.prayer_requests
  for insert to anon, authenticated
  with check (true);

drop policy if exists prayer_requests_admin_select on public.prayer_requests;
create policy prayer_requests_admin_select on public.prayer_requests
  for select to authenticated
  using (public.has_permission('prayer.manage'));

drop policy if exists prayer_requests_admin_write on public.prayer_requests;
create policy prayer_requests_admin_write on public.prayer_requests
  for update to authenticated
  using (public.has_permission('prayer.manage'))
  with check (public.has_permission('prayer.manage'));

-- ─── Giving: public read categories, no public reads on transactions.
drop policy if exists giving_categories_public_select on public.giving_categories;
create policy giving_categories_public_select on public.giving_categories
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists giving_categories_admin_write on public.giving_categories;
create policy giving_categories_admin_write on public.giving_categories
  for all to authenticated
  using (public.has_permission('giving.manage'))
  with check (public.has_permission('giving.manage'));

drop policy if exists giving_transactions_admin_all on public.giving_transactions;
create policy giving_transactions_admin_all on public.giving_transactions
  for all to authenticated
  using (public.has_permission('giving.manage'))
  with check (public.has_permission('giving.manage'));

-- ─── Contact messages & newsletter: public insert only; admin reads.
drop policy if exists contact_messages_public_insert on public.contact_messages;
create policy contact_messages_public_insert on public.contact_messages
  for insert to anon, authenticated
  with check (true);

drop policy if exists contact_messages_admin_select on public.contact_messages;
create policy contact_messages_admin_select on public.contact_messages
  for select to authenticated
  using (public.has_permission('contact.manage'));

drop policy if exists newsletter_public_insert on public.newsletter_subscribers;
create policy newsletter_public_insert on public.newsletter_subscribers
  for insert to anon, authenticated
  with check (true);

drop policy if exists newsletter_admin_all on public.newsletter_subscribers;
create policy newsletter_admin_all on public.newsletter_subscribers
  for all to authenticated
  using (public.has_permission('newsletter.manage'))
  with check (public.has_permission('newsletter.manage'));

-- ─── Audit logs: admin read only; no public writes (server-only insert via service role).
drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
  for select to authenticated
  using (public.has_permission('audit.view'));

-- Insert policy intentionally absent. Audit logs are written only via service role
-- (RLS bypassed) from server code / edge functions. This makes tampering impossible
-- from authenticated sessions.
