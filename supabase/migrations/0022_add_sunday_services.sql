-- =====================================================================
-- 0022 — Add Sunday services
--
-- Adds the two Sunday services (First Service and Second Service) to
-- the services table. Uses the same idempotent IF NOT EXISTS guard as
-- the seed migration (0021) so it is safe to run multiple times.
-- =====================================================================

do $$
begin
  if not exists (select 1 from public.services where name = 'First Service' and day_of_week = 0) then
    insert into public.services (name, description, day_of_week, start_time, end_time, location, is_recurring, sort_order, status)
    values ('First Service', null, 0, '08:00', '09:30', 'At the church', true, 1, 'PUBLISHED');
  end if;
  if not exists (select 1 from public.services where name = 'Second Service' and day_of_week = 0) then
    insert into public.services (name, description, day_of_week, start_time, end_time, location, is_recurring, sort_order, status)
    values ('Second Service', null, 0, '09:30', '12:30', 'At the church', true, 2, 'PUBLISHED');
  end if;
end$$;
