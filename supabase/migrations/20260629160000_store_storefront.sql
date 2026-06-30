-- NIL Stores — customizable storefront.
--   theme    — fonts + accent/background beyond the base primary/secondary colors
--   sections — ordered content blocks (about, featured products, gallery, banner,
--               testimonials, custom HTML, product grid) rendered on the storefront
alter table public.stores
  add column if not exists theme jsonb not null default '{}'::jsonb,
  add column if not exists sections jsonb not null default '[]'::jsonb;
