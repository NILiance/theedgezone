-- ============================================================================
-- NILiance opportunities (cached Sharetribe listings) + poll state
-- ============================================================================
-- Opportunities live in Sharetribe Marketplace as listings. We cache them
-- locally so:
--   - browse pages don't hit Sharetribe live
--   - admin / talent can see opportunities even if SDK creds drop temporarily
--   - we can filter by audience / category / status without a Sharetribe query
--
-- A cron syncs the cache periodically (vercel.json).

create table if not exists public.opportunities (
  id              uuid primary key default gen_random_uuid(),
  listing_uuid    text unique,                          -- Sharetribe listing UUID, null when local-only draft
  title           text not null,
  description     text not null,
  category        text,
  audience        text not null default 'talent',       -- talent | brand | everyone
  status          text not null default 'published',    -- draft | published | closed | expired
  price_cents     int,
  currency        text not null default 'usd',
  location        text,
  deadline_at     timestamptz,
  posted_by       uuid references auth.users(id) on delete set null,
  posted_by_uuid  text,                                 -- Sharetribe author UUID for display
  contact_email   text,
  external_url    text,
  meta            jsonb not null default '{}'::jsonb,
  cached_at       timestamptz not null default now(),   -- last sync from Sharetribe
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists opportunities_status_idx
  on public.opportunities (status, created_at desc);
create index if not exists opportunities_audience_idx
  on public.opportunities (audience, status);

alter table public.opportunities enable row level security;
create policy "opportunities_public_read"
  on public.opportunities for select
  using (status = 'published');
create policy "opportunities_admin_modify"
  on public.opportunities for all
  using (public.is_admin())
  with check (public.is_admin());
create policy "opportunities_owner_modify"
  on public.opportunities for update
  using (auth.uid() = posted_by)
  with check (auth.uid() = posted_by);
create policy "opportunities_owner_delete"
  on public.opportunities for delete
  using (auth.uid() = posted_by);
create policy "opportunities_owner_insert"
  on public.opportunities for insert
  with check (auth.uid() = posted_by);

create or replace function public.touch_opportunities()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists opportunities_touch on public.opportunities;
create trigger opportunities_touch
  before update on public.opportunities
  for each row execute function public.touch_opportunities();

-- ── Poll state ─────────────────────────────────────────────────────────────
-- Single-row table tracking the inbound-poll cursor + last-run timestamps
-- (separate from the per-user niliance_sync_events log).

create table if not exists public.niliance_poll_state (
  id              int primary key default 1,
  user_cursor     uuid,                                 -- last profile.id processed
  opp_cursor      timestamptz,                          -- last listing updated_at processed
  last_user_poll  timestamptz,
  last_opp_poll   timestamptz,
  last_error      text,
  updated_at      timestamptz not null default now(),
  check (id = 1)
);
insert into public.niliance_poll_state (id) values (1) on conflict do nothing;

alter table public.niliance_poll_state enable row level security;
create policy "niliance_poll_state_admin_only"
  on public.niliance_poll_state for all
  using (public.is_admin())
  with check (public.is_admin());
