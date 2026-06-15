-- Expanded brand preferences pulled from the legacy WP Brand Preferences
-- & Generation panel. Drives the prompt builder for our designer.

alter table profiles
  add column if not exists brand_vibe text,
  add column if not exists brand_bg_pref text default 'variety',
  add column if not exists brand_include_name boolean default true,
  add column if not exists brand_include_initials boolean default false,
  add column if not exists brand_include_jersey boolean default false,
  add column if not exists brand_elements text;

-- Migrate existing brand_symbol value into brand_elements so prior input
-- isn't lost. brand_symbol stays as a column but is no longer surfaced
-- in the UI.
update profiles
  set brand_elements = brand_symbol
  where brand_elements is null and brand_symbol is not null;
