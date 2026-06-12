-- ============================================================================
-- Phase 6.5 — Order → module provisioning link
-- ============================================================================

alter table public.orders
  add column if not exists provisioned_entity_id uuid,
  add column if not exists provisioned_at timestamptz;

create index if not exists orders_provisioned_idx
  on public.orders (provisioned_entity_id)
  where provisioned_entity_id is not null;
