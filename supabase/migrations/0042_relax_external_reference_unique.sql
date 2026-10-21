-- 0042 — The unique index on (provider, external_reference) also applied to
-- the temporary idempotency key that mpesa-stk-push writes before the Daraja
-- call returns. A temporary key is not a provider reference and must never be
-- subject to provider-reference uniqueness; the real CheckoutRequestID that
-- replaces it is unique in its own right.
drop index if exists public.idx_giving_tx_external_ref;
create unique index idx_giving_tx_external_ref
  on public.giving_transactions(provider, external_reference)
  where external_reference is not null
    and external_reference not like '%|%';
