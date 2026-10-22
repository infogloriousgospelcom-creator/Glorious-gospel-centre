-- 0033 — Member self-serve My Giving history (Phase I-B7)
-- Authenticated congregants may SELECT only their own giving_transactions
-- rows (created_by = auth.uid()) with safe columns only.
--
-- Ownership is already set by mpesa-stk-push Edge Function (created_by).
-- Legacy rows with created_by IS NULL remain invisible to congregants.
--
-- Admin access: existing giving.manage RLS policy is preserved.
-- After column-level grants, staff CMS reads/writes of admin_notes /
-- raw_callback must use service-role AFTER has_permission checks
-- (same pattern as connect_group_members private admin reads).
--
-- No INSERT/UPDATE/DELETE for congregants. No anon access.
-- Payment STK / callback / status Edge Functions unchanged (service_role).

-- =====================================================================
-- 1. Index for member history queries
-- =====================================================================

create index if not exists idx_giving_tx_created_by_created
  on public.giving_transactions (created_by, created_at desc);

-- =====================================================================
-- 2. Member SELECT policy (own rows only)
-- =====================================================================

drop policy if exists giving_transactions_self_select on public.giving_transactions;
create policy giving_transactions_self_select on public.giving_transactions
  for select to authenticated
  using (created_by = auth.uid());

-- Existing admin policy retained:
--   giving_transactions_admin_all — has_permission('giving.manage')

-- =====================================================================
-- 3. Least-privilege grants
-- =====================================================================
-- Default Supabase grants give authenticated/anon full table DML.
-- Tighten to match Connect Group membership column-grant pattern.
-- Grant ONLY columns required by My Giving UI.

revoke all on table public.giving_transactions from anon, authenticated;

grant select (
  id,
  category_id,
  external_reference,
  amount_cents,
  currency,
  status,
  created_at
) on table public.giving_transactions to authenticated;

-- Intentionally NOT granted to authenticated:
--   phone
--   provider
--   updated_at
--   admin_notes
--   raw_callback
--   created_by (not required for member UI; RLS already filters)
--   INSERT / UPDATE / DELETE
-- Note: category_id is granted only so PostgREST can resolve
--   category:giving_categories(label); the member UI does not display the UUID.

comment on policy giving_transactions_self_select on public.giving_transactions is
  'Congregants may read only their own gifts (created_by = auth.uid()). Safe columns via grants.';
