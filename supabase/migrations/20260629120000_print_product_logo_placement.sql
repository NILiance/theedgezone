-- Per-product logo placement for the Print Shop catalog overlay.
-- x/y are the logo CENTRE as a 0–1 fraction of the cover image; scale is the
-- logo width as a 0–1 fraction of the cover width.
alter table public.print_products
  add column if not exists logo_x numeric not null default 0.5,
  add column if not exists logo_y numeric not null default 0.5,
  add column if not exists logo_scale numeric not null default 0.30;
