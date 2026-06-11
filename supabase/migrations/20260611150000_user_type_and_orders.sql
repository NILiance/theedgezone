-- ============================================================================
-- Phase 3 — User type + product orders + dashboard metrics
-- ============================================================================

create type public.user_type as enum (
  'talent',
  'brand',
  'agency',
  'school',
  'parent',
  'fan',
  'staff'
);

alter table public.profiles
  add column if not exists user_type public.user_type,
  add column if not exists niliance_banner_dismissed_at timestamptz,
  add column if not exists nil_readiness_score int default 0
    check (nil_readiness_score between 0 and 100),
  add column if not exists profile_completion_pct int default 0
    check (profile_completion_pct between 0 and 100),
  add column if not exists points int not null default 0,
  add column if not exists niliance_user_id text,
  add column if not exists niliance_synced_at timestamptz;

-- Orders / purchased services
-- Will be expanded with line_items, Stripe webhooks, and provisioning jobs in
-- the marketplace phase. For now, a flat table is enough to populate the
-- talent dashboard's "My Products" grid.
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  product_slug         text not null,
  product_title        text not null,
  plan                 text,                         -- 'monthly' | 'annual' | 'onetime'
  amount_cents         bigint,
  currency             text not null default 'USD',
  status               text not null default 'pending',
                                                    -- pending | paid | active | ready
                                                    -- | provisioning | cancelled | refunded
  stripe_session_id    text,
  stripe_payment_intent text,
  crm_synced_at        timestamptz,
  purchased_at         timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index orders_user_purchased_idx on public.orders (user_id, purchased_at desc);
create index orders_user_status_idx on public.orders (user_id, status);

alter table public.orders enable row level security;

create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
