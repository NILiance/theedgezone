-- ============================================================================
-- Stripe wiring for revenue blocks
-- ============================================================================
-- One table for every public-site purchase regardless of kind. The four
-- kinds we currently mint sessions for:
--   tip       → tip_jar / gift_tip blocks
--   merch     → a single site_products row (or a future cart)
--   shoutout  → shoutout_request block (form payload in metadata)
--   tier      → membership_tiers block (Stripe subscription)

create table if not exists public.site_transactions (
  id                    uuid primary key default gen_random_uuid(),
  site_id               uuid not null references public.sites(id) on delete cascade,
  kind                  text not null,                       -- tip | merch | shoutout | tier
  block_id              uuid references public.site_blocks(id) on delete set null,
  product_id            uuid references public.site_products(id) on delete set null,
  tier_id               uuid references public.site_membership_tiers(id) on delete set null,
  amount_cents          int not null default 0,
  currency              text not null default 'usd',
  buyer_name            text,
  buyer_email           text,
  message               text,
  affiliate_code        text,                                -- ?ref attribution
  status                text not null default 'pending',     -- pending | paid | refunded | failed
  stripe_session_id     text unique,
  stripe_payment_intent text,
  stripe_subscription_id text,
  stripe_customer_id    text,
  metadata              jsonb not null default '{}'::jsonb,  -- recipient, address, options
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);
create index if not exists site_transactions_site_idx
  on public.site_transactions (site_id, created_at desc);
create index if not exists site_transactions_status_idx
  on public.site_transactions (status, created_at desc);

alter table public.site_transactions enable row level security;
-- Owner sees everything for their site
create policy "site_transactions_owner_read"
  on public.site_transactions for select
  using (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  );
-- Anyone (including anon) can create a pending row through the server
-- action's anon client. The endpoint validates kind / amounts before
-- inserting, so this is fine.
create policy "site_transactions_public_insert"
  on public.site_transactions for insert
  with check (true);
