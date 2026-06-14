-- Brand kit assembly tracking
alter table public.brand_designs
  add column if not exists brand_kit_url text,
  add column if not exists brand_kit_drive_id text,
  add column if not exists brand_kit_assembled_at timestamptz;
