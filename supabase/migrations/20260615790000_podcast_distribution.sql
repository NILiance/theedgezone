-- Podcasts parity, phase 4a: per-platform distribution links.
-- After submitting the RSS feed to each platform, the talent pastes the
-- resulting show URLs here; the public player links to the real listings
-- (instead of generic homepages).

alter table public.podcasts
  add column if not exists apple_url text,
  add column if not exists spotify_url text,
  add column if not exists youtube_url text,
  add column if not exists amazon_url text;
