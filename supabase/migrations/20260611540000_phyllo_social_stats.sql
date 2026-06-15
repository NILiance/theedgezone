-- Cached per-platform social stats sourced from Phyllo. Refreshed by the
-- /api/phyllo/sync endpoint when the talent opens the calculator or hits
-- "Pull from socials".
create table if not exists public.phyllo_social_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'twitter', 'youtube')),
  handle text,
  followers integer not null default 0,
  avg_likes integer not null default 0,
  avg_comments integer not null default 0,
  avg_shares integer not null default 0,
  engagement_rate numeric not null default 0,
  fetched_at timestamptz not null default now(),
  primary key (user_id, platform)
);
alter table public.phyllo_social_stats enable row level security;
create policy "phyllo_stats owner read"
  on public.phyllo_social_stats for select
  to authenticated using (user_id = auth.uid());
create policy "phyllo_stats owner write"
  on public.phyllo_social_stats for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "phyllo_stats admin all"
  on public.phyllo_social_stats for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
