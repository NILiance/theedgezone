-- Claude → Sharetribe durable two-way sync (Phase 1: users).
-- niliance_sync_events remains the human-readable log; these add the reliable
-- delivery layer the guide asks for: a stable id map + a retry outbox.

-- Stable Edge Zone <-> Sharetribe id mapping.
create table if not exists public.sharetribe_links (
  entity_type   text not null,            -- 'user' | 'listing' | 'transaction'
  entity_id     text not null,            -- Edge Zone id
  sharetribe_id text not null,            -- Sharetribe UUID
  user_id       uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (entity_type, entity_id)
);
create unique index if not exists sharetribe_links_st_idx
  on public.sharetribe_links (entity_type, sharetribe_id);

-- Durable outbox of sync events (status / attempts / backoff / error).
create table if not exists public.sharetribe_sync_outbox (
  id                bigserial primary key,
  event_id          text not null unique,            -- idempotency key
  event_type        text not null,                   -- claude.user.upserted, …
  entity_type       text not null,                   -- user | listing | transaction
  entity_id         text not null,
  user_id           uuid references auth.users(id) on delete set null,
  payload           jsonb not null default '{}'::jsonb,
  status            text not null default 'pending'  -- pending | synced | failed | skipped
                      check (status in ('pending', 'synced', 'failed', 'skipped')),
  attempts          int not null default 0,
  last_error        text,
  source_updated_at timestamptz not null default now(),
  next_attempt_at   timestamptz not null default now(),
  synced_at         timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists sharetribe_outbox_due_idx
  on public.sharetribe_sync_outbox (status, next_attempt_at);

alter table public.sharetribe_links enable row level security;
alter table public.sharetribe_sync_outbox enable row level security;
create policy "sharetribe_links admin read"
  on public.sharetribe_links for select to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
create policy "sharetribe_outbox admin read"
  on public.sharetribe_sync_outbox for select to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
-- Writes happen only via the service-role worker (bypasses RLS).
