-- NIL Stores parity, phase 4: revenue-split earnings reporting.
-- Snapshots the platform fee taken at checkout so the talent's earnings
-- report (gross − fee − supplier cost = net) stays accurate even if the
-- store commission rate changes later. Cost + quantity are already snapshot
-- on the order (phase 1).

alter table public.store_orders
  add column if not exists platform_fee_cents int;
