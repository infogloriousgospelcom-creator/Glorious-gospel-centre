-- 0014 — Lookup data seeds (idempotent)

insert into public.giving_categories (kind, label, description, sort_order) values
  ('TITHE',    'Tithe',    'Regular tithe (10%)',                 1),
  ('OFFERING', 'Offering', 'General offering',                    2),
  ('MISSIONS', 'Missions', 'Support for missions and outreach',   3),
  ('OTHER',    'Other',    'Other giving categories',             4)
on conflict (kind, label) do nothing;

-- Default site settings row (single-row table).
insert into public.site_settings (church_name, tagline)
select 'Glorious Gospel Centre', '[Official tagline to be provided]'
where not exists (select 1 from public.site_settings);
