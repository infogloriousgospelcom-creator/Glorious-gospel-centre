-- 0041 — Defense in depth: a completed giving transaction must not be reopened.
--
-- The staff override path (services/admin/giving.actions.ts) runs as service_role
-- and is permitted exactly one correction: SUCCESS -> FAILED, which is written
-- to admin_notes and recorded in audit_logs with a mandatory reason.
-- Every other SUCCESS -> X transition is rejected at the database level, which
-- also blocks a direct PostgREST write made with an admin's own JWT.
create or replace function public.guard_giving_success_transition()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'SUCCESS' and new.status is distinct from 'SUCCESS' then
    if current_setting('request.jwt.claim.role', true) = 'service_role'
       and new.status = 'FAILED' then
      return new;   -- audited correction path
    end if;
    raise exception 'A completed giving transaction cannot be changed from SUCCESS to %', new.status
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_giving_success_transition on public.giving_transactions;
create trigger trg_guard_giving_success_transition
  before update on public.giving_transactions
  for each row execute function public.guard_giving_success_transition();
