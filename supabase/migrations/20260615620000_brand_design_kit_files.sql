-- Per-asset URLs from the brand kit assembly so the Brand Guide UI can
-- show every file individually instead of just the ZIP. Mirrors what the
-- legacy WP plugin stored under brand['final_logo_files'].

alter table brand_designs
  add column if not exists kit_files jsonb not null default '[]'::jsonb;
