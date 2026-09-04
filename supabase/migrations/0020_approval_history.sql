-- 0020 — Approval history
-- Records every status transition for content entities (events, sermons,
-- announcements, pages). Mirrors the subset of audit_logs that is
-- relevant to approval workflows, and gives the admin UI a fast,
-- structured view per item.

create table if not exists public.approval_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('events','sermons','announcements','pages')),
  entity_id uuid not null,
  actor_id uuid references public.profiles(id),
  from_status public.content_status,
  to_status public.content_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_approval_history_entity on public.approval_history(entity_type, entity_id, created_at desc);
create index if not exists idx_approval_history_actor on public.approval_history(actor_id, created_at desc);

-- RLS
alter table public.approval_history enable row level security;

-- Public read: only content managers see the history (mirrors content.manage).
drop policy if exists approval_history_admin_select on public.approval_history;
create policy approval_history_admin_select on public.approval_history
  for select to authenticated
  using (public.has_permission('content.manage'));

-- No insert policy: only service-role may insert (we never want an authenticated
-- session to write history directly; all writes go through server actions using
-- the service-role client).
