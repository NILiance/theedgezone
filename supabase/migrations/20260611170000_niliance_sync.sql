-- ============================================================================
-- Phase 7 — NILiance / Sharetribe sync state on profiles
-- ============================================================================

alter table public.profiles
  add column if not exists niliance_link_status text not null default 'unlinked',
    -- 'unlinked' | 'pending' | 'linked' | 'error'
  add column if not exists niliance_link_error text,
  add column if not exists niliance_listing_id text,
  add column if not exists niliance_last_attempt_at timestamptz;

-- Sync events / event-log table for audit + retry inspection
create table if not exists public.niliance_sync_events (
  id            bigserial primary key,
  user_id       uuid references auth.users(id) on delete set null,
  level         text not null,              -- 'info' | 'warn' | 'error'
  direction     text not null,              -- 'outbound' | 'inbound'
  message       text not null,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

create index niliance_sync_events_time_idx on public.niliance_sync_events (created_at desc);
create index niliance_sync_events_user_idx on public.niliance_sync_events (user_id, created_at desc);
create index niliance_sync_events_level_idx on public.niliance_sync_events (level, created_at desc);

alter table public.niliance_sync_events enable row level security;

create policy "niliance_sync_events_admin_read"
  on public.niliance_sync_events for select
  using (public.is_admin());
