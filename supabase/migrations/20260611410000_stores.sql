-- ============================================================================
-- NIL Stores — talent-owned merch storefronts
-- ============================================================================
-- v1 ships a manually-curated catalog per store. Supplier API integration
-- (PromoStandards / S&S / SanMar) is deferred — the product schema is shaped
-- to accept supplier-sourced fields when we plug those in later.

create table if not exists public.stores (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  order_id        uuid references public.orders(id) on delete set null,
  slug            text not null,
  name            text not null,
  tagline         text,
  description     text,
  hero_image_url  text,
  logo_url        text,
  primary_color   text not null default '#C8A84E',
  secondary_color text not null default '#000000',
  status          text not null default 'draft',
  -- one of: draft | open | paused | archived
  custom_domain   text,
  contact_email   text,
  payout_currency text not null default 'usd',
  -- platform takes the same 15% fee as the site builder
  commission_bps  int not null default 1500,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, slug)
);
create index if not exists stores_slug_idx on public.stores (slug);

create table if not exists public.store_products (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores(id) on delete cascade,
  slug              text not null,
  name              text not null,
  description       text,
  price_cents       int not null default 0,
  compare_at_cents  int,
  currency          text not null default 'usd',
  inventory         int,
  weight_grams      int,
  -- Supplier-sourced fields (null until we plug in supplier APIs)
  supplier          text,
  supplier_sku      text,
  supplier_payload  jsonb,
  -- Visuals + variants
  primary_image_url text,
  image_urls        jsonb not null default '[]'::jsonb,
  variants          jsonb not null default '[]'::jsonb,
  -- Each variant: { size?, color?, sku, price_cents?, inventory?, image_url? }
  tags              text[] not null default '{}'::text[],
  position          int not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (store_id, slug)
);
create index if not exists store_products_store_idx
  on public.store_products (store_id, position);
create index if not exists store_products_active_idx
  on public.store_products (store_id, active);

create table if not exists public.store_orders (
  id                    uuid primary key default gen_random_uuid(),
  store_id              uuid not null references public.stores(id) on delete cascade,
  product_id            uuid references public.store_products(id) on delete set null,
  variant_sku           text,
  buyer_email           text,
  buyer_name            text,
  shipping_address      jsonb,
  amount_cents          int not null,
  currency              text not null default 'usd',
  status                text not null default 'pending',
  -- one of: pending | paid | fulfilled | shipped | cancelled | refunded
  stripe_session_id     text unique,
  stripe_payment_intent text,
  tracking_carrier      text,
  tracking_number       text,
  paid_at               timestamptz,
  shipped_at            timestamptz,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);
create index if not exists store_orders_store_idx
  on public.store_orders (store_id, created_at desc);
create index if not exists store_orders_status_idx
  on public.store_orders (status, created_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.stores enable row level security;
create policy "stores_owner_all"
  on public.stores for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stores_public_open_read"
  on public.stores for select using (status = 'open');
create policy "stores_admin_read"
  on public.stores for select using (public.is_admin());

alter table public.store_products enable row level security;
create policy "products_owner_modify"
  on public.store_products for all
  using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));
create policy "products_public_active_read"
  on public.store_products for select
  using (
    active = true and exists (
      select 1 from public.stores s where s.id = store_id and s.status = 'open'
    )
  );
create policy "products_admin_read"
  on public.store_products for select using (public.is_admin());

alter table public.store_orders enable row level security;
create policy "orders_owner_read"
  on public.store_orders for select
  using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));
create policy "orders_owner_update"
  on public.store_orders for update
  using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));
create policy "orders_public_insert"
  on public.store_orders for insert with check (true);
create policy "orders_admin_read"
  on public.store_orders for select using (public.is_admin());

-- Touch trigger shared
create or replace function public.touch_store()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists stores_touch on public.stores;
create trigger stores_touch before update on public.stores
  for each row execute function public.touch_store();
drop trigger if exists store_products_touch on public.store_products;
create trigger store_products_touch before update on public.store_products
  for each row execute function public.touch_store();
