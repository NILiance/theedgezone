-- Podcasts parity, phase 1: episode CRUD + audio uploads.
-- Enriches podcasts + podcast_episodes with the fields an iTunes/podcast RSS
-- feed and a public player need, and adds a dedicated media bucket for audio
-- (too large for the 10MB site-assets bucket).

alter table public.podcasts
  add column if not exists author text,
  add column if not exists category text,                 -- Apple category, e.g. "Sports"
  add column if not exists language text not null default 'en',
  add column if not exists explicit boolean not null default false,
  add column if not exists primary_color text not null default '#C8A84E',
  add column if not exists secondary_color text not null default '#0a0a0a';

alter table public.podcast_episodes
  add column if not exists audio_bytes bigint,            -- RSS enclosure length
  add column if not exists audio_mime text,               -- RSS enclosure type
  add column if not exists guid text,                     -- stable RSS <guid>
  add column if not exists season_number int,
  add column if not exists explicit boolean not null default false,
  add column if not exists image_url text;

create index if not exists podcast_episodes_podcast_idx
  on public.podcast_episodes (podcast_id, episode_number desc);

-- ── Podcast media bucket (audio + episode/cover art) ────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'podcast-media',
  'podcast-media',
  true,
  524288000,                                              -- 500 MB per file
  array[
    'audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/aac',
    'audio/wav','audio/x-wav','audio/ogg','audio/webm',
    'image/png','image/jpeg','image/webp'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Owner owns objects under their {user_id}/… path; public can read.
drop policy if exists "podcast_media_public_read" on storage.objects;
create policy "podcast_media_public_read"
  on storage.objects for select
  using (bucket_id = 'podcast-media');

drop policy if exists "podcast_media_insert_own" on storage.objects;
create policy "podcast_media_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'podcast-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "podcast_media_update_own" on storage.objects;
create policy "podcast_media_update_own"
  on storage.objects for update
  using (
    bucket_id = 'podcast-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "podcast_media_delete_own" on storage.objects;
create policy "podcast_media_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'podcast-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
