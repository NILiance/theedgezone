-- Podcasts: episode chapters (timestamped markers). Stored as a jsonb array of
-- { start: "M:SS" | "H:MM:SS", title }. Exposed as a podcast-namespace
-- chapters JSON file referenced from the RSS feed.
alter table public.podcast_episodes
  add column if not exists chapters jsonb not null default '[]'::jsonb;
