-- 0025_harden_public_inserts_and_rate_limits.sql
-- Close anonymous REST insert bypass for public forms.
-- Inserts must go through validated server actions using the service role.
-- Add a shared rate_limit_buckets table for multi-instance rate limiting.

-- ─── Drop unrestricted public INSERT policies ───────────────────────────────
drop policy if exists event_registrations_public_insert on public.event_registrations;
drop policy if exists prayer_requests_public_insert on public.prayer_requests;
drop policy if exists contact_messages_public_insert on public.contact_messages;
drop policy if exists newsletter_public_insert on public.newsletter_subscribers;

-- ─── Rate limit buckets (service-role / SECURITY DEFINER only) ──────────────
create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  tokens integer not null,
  reset_at timestamptz not null
);

alter table public.rate_limit_buckets enable row level security;
-- No policies for anon/authenticated — only service role / SECURITY DEFINER.

create or replace function public.consume_rate_limit(
  p_key text,
  p_capacity integer,
  p_window_ms integer
)
returns table (ok boolean, remaining integer, reset_ms integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.rate_limit_buckets%rowtype;
  v_window interval := make_interval(secs => greatest(p_window_ms, 1000) / 1000.0);
begin
  if p_key is null or length(p_key) < 3 or p_capacity < 1 then
    return query select false, 0, p_window_ms;
    return;
  end if;

  select * into v_row from public.rate_limit_buckets where bucket_key = p_key for update;

  if not found or v_row.reset_at <= v_now then
    insert into public.rate_limit_buckets (bucket_key, tokens, reset_at)
    values (p_key, p_capacity - 1, v_now + v_window)
    on conflict (bucket_key) do update
      set tokens = p_capacity - 1,
          reset_at = v_now + v_window;
    return query select true, p_capacity - 1, p_window_ms;
    return;
  end if;

  if v_row.tokens <= 0 then
    return query select false, 0,
      greatest(0, (extract(epoch from (v_row.reset_at - v_now)) * 1000)::integer);
    return;
  end if;

  update public.rate_limit_buckets
    set tokens = tokens - 1
    where bucket_key = p_key;

  return query select true, v_row.tokens - 1,
    greatest(0, (extract(epoch from (v_row.reset_at - v_now)) * 1000)::integer);
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
-- Allow authenticated server paths that use the anon key via RPC after validation? No —
-- only service_role. Server actions use service role for rate limit when configured.

comment on function public.consume_rate_limit is
  'Atomic token-bucket rate limiter. Call only from service-role server code.';
