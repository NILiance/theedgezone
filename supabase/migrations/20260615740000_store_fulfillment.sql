-- NIL Stores parity, phase 3: fulfillment dispatch.
-- Tracks whether a paid order was auto-submitted to a supplier or needs
-- manual fulfillment. The order lifecycle (pending/paid/fulfilled/shipped/…)
-- stays in store_orders.status; these add the supplier-side detail.

alter table public.store_orders
  -- unfulfilled | submitted | manual | shipped | delivered | failed
  add column if not exists fulfillment_status text not null default 'unfulfilled',
  add column if not exists supplier_order_id text,
  add column if not exists fulfillment_error text;

create index if not exists store_orders_fulfillment_idx
  on public.store_orders (fulfillment_status, created_at desc);
