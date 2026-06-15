-- Per-service pricing extras. Generic jsonb so any service can add
-- its own fields without a schema migration. Brand design uses:
--   { revision_price_cents, first_revision_free, additional_brand_price_cents }

alter table service_pricing
  add column if not exists extras jsonb not null default '{}'::jsonb;
