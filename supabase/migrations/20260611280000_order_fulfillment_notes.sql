-- Add an admin-only freeform notes column for fulfillment workflow.
alter table public.orders
  add column if not exists fulfillment_notes text;
