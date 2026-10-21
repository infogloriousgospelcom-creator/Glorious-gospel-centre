-- 0043 — Expire giving transactions whose Daraja callback never arrived.
-- Without this, a lost callback leaves the row PROCESSING forever and the
-- donor sees "Processing" indefinitely.
create or replace function public.expire_stale_giving_transactions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.giving_transactions
     set status = 'FAILED',
         admin_notes = coalesce(admin_notes, 'Expired: no payment confirmation received within 30 minutes.'),
         updated_at = now()
   where status in ('PENDING','PROCESSING')
     and updated_at < now() - interval '30 minutes';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_stale_giving_transactions() from public;
grant execute on function public.expire_stale_giving_transactions() to service_role;

-- pg_cron must be present for the schedule below. It is in
-- shared_preload_libraries on Supabase but is NOT always enabled, and a
-- silent no-op here would leave orphan transactions stuck in PROCESSING
-- forever — the exact bug this migration exists to fix.
do $$
begin
  create extension if not exists pg_cron with schema extensions;
exception
  when others then
    raise notice 'pg_cron could not be enabled; expire_stale_giving_transactions() must be invoked by other means';
end;
$$;

-- Fire every 10 minutes via pg_cron.
-- The command string MUST be single-quoted here: a dollar-quoted string
-- nested inside this dollar-quoted body closes the body early and the
-- migration fails to parse.
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'expire-giving-transactions',
      '*/10 * * * *',
      'select public.expire_stale_giving_transactions();'
    );
  else
    raise notice 'pg_cron unavailable — stale giving transactions will not be expired automatically';
  end if;
end $$;