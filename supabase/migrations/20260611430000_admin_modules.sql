-- App Builder defaults (singleton settings)
create table if not exists public.app_defaults (
  id text primary key default 'default',
  default_links jsonb not null default '[]'::jsonb,
  splash_ad jsonb,
  footer_ad jsonb,
  in_feed_ad jsonb,
  interstitial_ad jsonb,
  auto_enroll_edgezone_merch boolean not null default true,
  show_platform_merch boolean not null default true,
  revenue_share_talent numeric not null default 0.85,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  constraint app_defaults_singleton check (id = 'default')
);
alter table public.app_defaults enable row level security;
drop policy if exists "app_defaults read for authed" on public.app_defaults;
create policy "app_defaults read for authed"
  on public.app_defaults for select
  to authenticated using (true);
drop policy if exists "app_defaults admin write" on public.app_defaults;
create policy "app_defaults admin write"
  on public.app_defaults for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
insert into public.app_defaults (id) values ('default') on conflict (id) do nothing;

-- CMS pages
create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  body_md text not null default '',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamptz
);
alter table public.cms_pages enable row level security;
drop policy if exists "cms_pages public read published" on public.cms_pages;
create policy "cms_pages public read published"
  on public.cms_pages for select
  to anon, authenticated using (status = 'published');
drop policy if exists "cms_pages admin all" on public.cms_pages;
create policy "cms_pages admin all"
  on public.cms_pages for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Podcasts
create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text,
  cover_url text,
  status text not null default 'draft' check (status in ('draft', 'live', 'archived')),
  apple_connect_email text,
  rss_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.podcasts enable row level security;
drop policy if exists "podcasts public read live" on public.podcasts;
create policy "podcasts public read live"
  on public.podcasts for select
  to anon, authenticated using (status = 'live');
drop policy if exists "podcasts owner full" on public.podcasts;
create policy "podcasts owner full"
  on public.podcasts for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "podcasts admin full" on public.podcasts;
create policy "podcasts admin full"
  on public.podcasts for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create table if not exists public.podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  podcast_id uuid not null references public.podcasts(id) on delete cascade,
  episode_number integer,
  title text not null,
  description text,
  audio_url text,
  transcript text,
  duration_seconds integer,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.podcast_episodes enable row level security;
drop policy if exists "podcast_episodes follow podcast" on public.podcast_episodes;
create policy "podcast_episodes follow podcast"
  on public.podcast_episodes for select
  to anon, authenticated using (
    exists (
      select 1 from public.podcasts p
      where p.id = podcast_episodes.podcast_id and p.status = 'live'
    )
  );
drop policy if exists "podcast_episodes owner full" on public.podcast_episodes;
create policy "podcast_episodes owner full"
  on public.podcast_episodes for all
  to authenticated using (
    exists (
      select 1 from public.podcasts p
      where p.id = podcast_episodes.podcast_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.podcasts p
      where p.id = podcast_episodes.podcast_id and p.user_id = auth.uid()
    )
  );
drop policy if exists "podcast_episodes admin full" on public.podcast_episodes;
create policy "podcast_episodes admin full"
  on public.podcast_episodes for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Rewards
create table if not exists public.reward_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  points_cost integer not null check (points_cost >= 0),
  stock integer,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.reward_items enable row level security;
drop policy if exists "reward_items public read active" on public.reward_items;
create policy "reward_items public read active"
  on public.reward_items for select
  to anon, authenticated using (status = 'active');
drop policy if exists "reward_items admin write" on public.reward_items;
create policy "reward_items admin write"
  on public.reward_items for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_item_id uuid not null references public.reward_items(id) on delete restrict,
  points_spent integer not null check (points_spent > 0),
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);
alter table public.reward_redemptions enable row level security;
drop policy if exists "reward_redemptions owner read" on public.reward_redemptions;
create policy "reward_redemptions owner read"
  on public.reward_redemptions for select
  to authenticated using (user_id = auth.uid());
drop policy if exists "reward_redemptions owner insert" on public.reward_redemptions;
create policy "reward_redemptions owner insert"
  on public.reward_redemptions for insert
  to authenticated with check (user_id = auth.uid());
drop policy if exists "reward_redemptions admin all" on public.reward_redemptions;
create policy "reward_redemptions admin all"
  on public.reward_redemptions for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Talent points balance (add column on profiles if not present)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'points_balance'
  ) then
    alter table public.profiles add column points_balance integer not null default 0;
  end if;
end $$;
