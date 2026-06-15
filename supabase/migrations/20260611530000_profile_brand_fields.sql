-- Extend profiles.Brand section to cover everything Brand Designer needs.
alter table public.profiles
  add column if not exists brand_accent_color text,
  add column if not exists brand_neutral_color text,
  add column if not exists brand_style_seed text,
  add column if not exists brand_mood text,
  add column if not exists brand_audience text,
  add column if not exists brand_font_pair text,
  add column if not exists brand_values jsonb not null default '[]'::jsonb,
  add column if not exists brand_inspiration_urls jsonb not null default '[]'::jsonb,
  add column if not exists brand_avoid text;
