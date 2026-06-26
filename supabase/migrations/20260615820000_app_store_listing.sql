-- Apps parity, phase 2: App Store / Google Play submission intake.
-- One jsonb blob holds the whole listing (flat keys defined in
-- lib/app-store-listing.ts) so the field set can grow without migrations.

alter table public.talent_apps
  add column if not exists store_listing jsonb not null default '{}'::jsonb;
