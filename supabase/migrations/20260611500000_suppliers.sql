-- Supplier credentials (admin only). Per-supplier creds, decryption left
-- to env-time KMS or service-role decryption — we keep them in jsonb for
-- maximum flexibility (account id, token, partner id, etc).
create table if not exists public.supplier_credentials (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null unique,
  display_name text not null,
  description text,
  credentials jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  last_tested_at timestamptz,
  last_test_status text,
  last_test_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.supplier_credentials enable row level security;
create policy "supplier_credentials admin all"
  on public.supplier_credentials for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Supplier-sourced product cache. We pull catalog items, cache them here,
-- and let talents add them to their stores. Doesn't replace the existing
-- store_products table — that one is the talent's curated set.
create table if not exists public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null,
  supplier_sku text not null,
  name text not null,
  description text,
  brand text,
  category text,
  base_price_cents integer not null default 0,
  wholesale_price_cents integer,
  suggested_msrp_cents integer,
  currency text not null default 'usd',
  primary_image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  color_options jsonb not null default '[]'::jsonb,
  size_options jsonb not null default '[]'::jsonb,
  inventory_total integer,
  attributes jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default now(),
  active boolean not null default true,
  unique (supplier_code, supplier_sku)
);
create index if not exists supplier_products_supplier_idx
  on public.supplier_products (supplier_code, active);
create index if not exists supplier_products_name_idx
  on public.supplier_products using gin (to_tsvector('english', name));
alter table public.supplier_products enable row level security;
create policy "supplier_products authed read"
  on public.supplier_products for select
  to authenticated using (active = true);
create policy "supplier_products admin all"
  on public.supplier_products for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Track imports: when a talent adds a supplier product to their store, link
-- the resulting store_products row back to the supplier_products row so we
-- can refresh inventory + pricing in place later.
alter table public.store_products
  add column if not exists supplier_product_id uuid references public.supplier_products(id) on delete set null,
  add column if not exists supplier_last_synced_at timestamptz,
  add column if not exists supplier_sync_status text;

create index if not exists store_products_supplier_product_idx
  on public.store_products (supplier_product_id) where supplier_product_id is not null;

-- Seed empty rows for known suppliers so the admin UI lists them.
insert into public.supplier_credentials (supplier_code, display_name, description) values
  ('mock', 'Mock Supplier', 'Returns sample data for development and demo. No credentials needed.'),
  ('promostandards', 'PromoStandards', 'Industry-standard SOAP API across 200+ promotional product suppliers.'),
  ('ssactivewear', 'S&S Activewear', 'Major wholesale apparel distributor — REST API with account + token auth.'),
  ('sanmar', 'SanMar', 'Apparel + headwear distributor. Requires distributor account.'),
  ('onesource', 'OneSource', 'Promo product aggregator covering 500+ suppliers.')
on conflict (supplier_code) do nothing;
