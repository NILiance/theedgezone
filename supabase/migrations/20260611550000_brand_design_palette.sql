-- Store the dominant colors we extract from the talent's chosen logo so
-- the brand kit + downstream assets reflect what was actually rendered.
alter table public.brand_designs
  add column if not exists accent_color text,
  add column if not exists neutral_color text;
