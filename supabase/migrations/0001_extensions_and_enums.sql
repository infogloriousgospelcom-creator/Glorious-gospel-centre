-- 0001 — Extensions & enums
-- Shared primitives used across the schema.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Reusable content lifecycle status.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum (
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'PUBLISHED',
      'REJECTED',
      'ARCHIVED'
    );
  end if;
end$$;

-- Generic giving categories reference values.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'giving_category_kind') then
    create type public.giving_category_kind as enum (
      'TITHE',
      'OFFERING',
      'MISSIONS',
      'OTHER'
    );
  end if;
end$$;

-- Giving transaction lifecycle.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'giving_tx_status') then
    create type public.giving_tx_status as enum (
      'PENDING',
      'PROCESSING',
      'SUCCESS',
      'FAILED',
      'CANCELLED'
    );
  end if;
end$$;

-- Prayer request triage states.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'prayer_status') then
    create type public.prayer_status as enum (
      'NEW',
      'READ',
      'RESPONDED',
      'ARCHIVED'
    );
  end if;
end$$;
