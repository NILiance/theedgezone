-- Brand Design: capture which concept the user picked + when.
alter table public.brand_designs
  add column if not exists final_logo_url text,
  add column if not exists finalized_at timestamptz;
