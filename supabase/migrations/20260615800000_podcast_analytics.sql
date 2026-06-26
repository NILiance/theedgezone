-- Podcasts parity, phase 4b: play + download analytics.
-- Downloads are counted by routing the RSS enclosure through a redirect
-- endpoint (the standard podcast-host approach); on-page plays via a beacon.
-- Denormalized counters on the episode for fast display + a raw log for dedup.

alter table public.podcast_episodes
  add column if not exists play_count integer not null default 0,
  add column if not exists download_count integer not null default 0;

create table if not exists public.podcast_plays (
  id          uuid primary key default gen_random_uuid(),
  podcast_id  uuid not null references public.podcasts(id) on delete cascade,
  episode_id  uuid not null references public.podcast_episodes(id) on delete cascade,
  kind        text not null default 'play',   -- play | download
  ip_hash     text,
  ua          text,
  created_at  timestamptz not null default now()
);
create index if not exists podcast_plays_episode_idx
  on public.podcast_plays (episode_id, created_at desc);
create index if not exists podcast_plays_dedup_idx
  on public.podcast_plays (episode_id, kind, ip_hash, created_at desc);

alter table public.podcast_plays enable row level security;
-- Owners read their own podcast's analytics; inserts happen via the service
-- client in server routes (no public insert policy).
drop policy if exists "podcast_plays owner read" on public.podcast_plays;
create policy "podcast_plays owner read"
  on public.podcast_plays for select
  to authenticated using (
    exists (select 1 from public.podcasts p where p.id = podcast_id and p.user_id = auth.uid())
  );

-- Atomic counter bump.
create or replace function public.bump_podcast_count(p_episode uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_kind = 'download' then
    update public.podcast_episodes set download_count = download_count + 1 where id = p_episode;
  else
    update public.podcast_episodes set play_count = play_count + 1 where id = p_episode;
  end if;
end $$;
revoke all on function public.bump_podcast_count(uuid, text) from public, anon;
grant execute on function public.bump_podcast_count(uuid, text) to service_role, authenticated;
