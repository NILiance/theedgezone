-- NIL Stores parity, phase 1: variant + quantity checkout + cost tracking.
-- store_products.variants jsonb + store_orders.variant_sku already exist;
-- this adds the cost/quantity fields the storefront, checkout, and the
-- later revenue-split payouts need.

alter table public.store_products
  -- Supplier / COGS per unit, for the talent payout split. Variant rows
  -- may carry their own cost_cents; this is the product-level default.
  add column if not exists cost_cents int;

alter table public.store_orders
  add column if not exists quantity int not null default 1,
  -- Snapshots at purchase time so payout math + history stay correct even
  -- if the product is edited or deleted later.
  add column if not exists unit_price_cents int,
  add column if not exists cost_cents int,
  add column if not exists variant_label text;
