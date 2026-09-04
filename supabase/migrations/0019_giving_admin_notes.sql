-- 0019 — Add admin_notes to giving_transactions
-- Stores the most recent admin override reason. New overrides overwrite.
-- The full audit trail is in public.audit_logs (Phase 17).

alter table public.giving_transactions
  add column if not exists admin_notes text;
