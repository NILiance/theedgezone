-- Per-product cost breakdown for the Print Shop.
--   cost_cents       — our cost for the blank (e.g. S&S wholesale)
--   print_cost_cents — decoration / print cost
--   base_price_cents — stays the RETAIL (customer) price
-- Margin = base_price_cents - cost_cents - print_cost_cents.
alter table public.print_products
  add column if not exists cost_cents integer not null default 0,
  add column if not exists print_cost_cents integer not null default 0;
