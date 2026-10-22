-- 0030 — Revoke leave_connect_group EXECUTE from anon
-- 0029 revoked from PUBLIC and granted to authenticated, but Supabase
-- default function grants also give EXECUTE to anon/service_role on CREATE.
-- Congregant leave must not be callable by the anonymous role.

revoke all on function public.leave_connect_group(uuid) from public;
revoke all on function public.leave_connect_group(uuid) from anon;
grant execute on function public.leave_connect_group(uuid) to authenticated;

comment on function public.leave_connect_group(uuid) is
  'Member leave: ACTIVE → LEFT for the caller''s own membership only. No admin fields. EXECUTE: authenticated only (not anon).';
