-- 0045 — Fix the role detection in the giving-success guard trigger.
--
-- 0041 gated the staff-override carve-out on:
--
--     current_setting('request.jwt.claim.role', true) = 'service_role'
--
-- That is wrong for PostgREST. PostgREST exposes the decoded JWT payload as
-- `request.jwt.claims` (a JSON blob) and does NOT populate the individual
-- `request.jwt.claim.*` settings. Measured against production on the anon and
-- service_role keys:
--
--     claim_role : null
--     claims     : {"exp":...,"iss":"supabase","ref":"...","role":"anon"}
--
-- So `current_setting('request.jwt.claim.role', true)` is NULL in an API
-- request, `NULL = 'service_role'` is NULL rather than true, and the carve-out
-- never fires. The practical effect was that the audited staff correction
-- path (SUCCESS -> FAILED, service_role, mandatory reason) was rejected by
-- the database, while the trigger could not tell service_role from anybody
-- else.
--
-- This migration resolves the role from the JWT payload first, and falls back
-- to the individual setting for direct SQL sessions. The carve-out itself is
-- unchanged and remains exactly one transition: service_role may move a
-- SUCCESS transaction to FAILED, and nothing else.

create or replace function public.guard_giving_success_transition()
returns trigger
language plpgsql
as $$
declare
  v_role text;
begin
  if old.status = 'SUCCESS' and new.status is distinct from 'SUCCESS' then
    -- Resolve the caller's role.
    --
    -- `request.jwt.claims` is the decoded JWT payload that PostgREST sets;
    -- the individual `request.jwt.claim.*` settings are not populated there.
    -- The fallback covers direct SQL sessions (e.g. the SQL editor), where
    -- only the individual setting is present.
    v_role := nullif(current_setting('request.jwt.claim.role', true), '');

    if v_role is null then
      begin
        v_role :=
          nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
      exception
        when others then
          v_role := null;
      end;
    end if;

    if v_role = 'service_role' and new.status = 'FAILED' then
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
