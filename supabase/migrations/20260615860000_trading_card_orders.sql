-- Trading Card physical orders + admin-editable pricing tiers.
-- Parity with the legacy EdgeZoneFulfillment trading-card order flow:
-- tiered quantity pricing (25/50/100/250), pick a generated card, pay,
-- and we print + ship premium 2.5"x3.5" glossy cards (proof emailed first).

-- ── Pricing tiers (admin-editable; seeded with the legacy defaults) ──
create table if not exists public.trading_card_tiers (
  id          uuid primary key default gen_random_uuid(),
  qty         int  not null check (qty > 0),
  price_cents int  not null check (price_cents >= 0),
  label       text not null,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.trading_card_tiers enable row level security;

-- Any authenticated talent can read tiers (needed to render the order panel).
drop policy if exists "tc_tiers read" on public.trading_card_tiers;
create policy "tc_tiers read"
  on public.trading_card_tiers for select
  to authenticated using (true);

-- Only admins manage tiers (service role bypasses RLS for the checkout route).
drop policy if exists "tc_tiers admin all" on public.trading_card_tiers;
create policy "tc_tiers admin all"
  on public.trading_card_tiers for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed the legacy defaults once. Guarded on emptiness so a re-run never
-- duplicates and never resurrects tiers an admin has since deleted.
insert into public.trading_card_tiers (qty, price_cents, label, sort_order)
select v.qty, v.price_cents, v.label, v.sort_order
from (values
  (25,  4999, '25 Cards',  0),
  (50,  7999, '50 Cards',  1),
  (100, 12999, '100 Cards', 2),
  (250, 24999, '250 Cards', 3)
) as v(qty, price_cents, label, sort_order)
where not exists (select 1 from public.trading_card_tiers);

-- ── Orders ──
create table if not exists public.trading_card_orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text not null unique,
  user_id              uuid not null references auth.users(id) on delete cascade,
  brand_design_id      uuid references public.brand_designs(id) on delete set null,
  addon_id             uuid references public.brand_design_addons(id) on delete set null,
  card_url             text,
  card_style           text,
  quantity             int  not null,
  unit_label           text,
  amount_cents         int  not null,
  currency             text not null default 'usd',
  ship_name            text,
  shipping_address     jsonb,
  notes                text,
  -- pending | paid | in_production | shipped | cancelled
  status               text not null default 'pending',
  tracking_url         text,
  stripe_session_id    text unique,
  stripe_payment_intent text,
  paid_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.trading_card_orders enable row level security;

-- Owner reads their own orders.
drop policy if exists "tc_orders owner read" on public.trading_card_orders;
create policy "tc_orders owner read"
  on public.trading_card_orders for select
  to authenticated using (auth.uid() = user_id);

-- Owner pre-inserts their own pending order from the checkout route.
drop policy if exists "tc_orders owner insert" on public.trading_card_orders;
create policy "tc_orders owner insert"
  on public.trading_card_orders for insert
  to authenticated with check (auth.uid() = user_id);

-- Admins manage all orders (status, tracking).
drop policy if exists "tc_orders admin all" on public.trading_card_orders;
create policy "tc_orders admin all"
  on public.trading_card_orders for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists idx_tc_orders_user
  on public.trading_card_orders(user_id, created_at desc);
create index if not exists idx_tc_orders_status
  on public.trading_card_orders(status, created_at desc);
