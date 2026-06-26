-- Admin-uploadable favicon. Stored in the public site-assets bucket;
-- the URL lives on the singleton branding_settings row and is served from
-- the root layout's generateMetadata().
alter table public.branding_settings
  add column if not exists favicon_url text;
