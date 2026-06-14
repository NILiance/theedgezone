-- ============================================================================
-- Climb / Path to the Summit — milestone-based coaching journey
-- ============================================================================

create table if not exists public.climb_milestones (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  summary         text,
  position        int not null default 0,
  -- Visual / media
  hero_image_url  text,
  video_url       text,
  -- Free-form slides: array of { heading, body, media_url? }
  slides          jsonb not null default '[]'::jsonb,
  -- Optional CTA: 'Open Brand Studio', 'Set up payouts', etc.
  cta_label       text,
  cta_url         text,
  -- Roughly how long this milestone takes to complete (minutes)
  duration_min    int,
  audience        text not null default 'all',
  -- one of: all | talent | brand
  published       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists climb_position_idx on public.climb_milestones (position);

create table if not exists public.user_climb_progress (
  user_id         uuid not null references auth.users(id) on delete cascade,
  milestone_id    uuid not null references public.climb_milestones(id) on delete cascade,
  completed_at    timestamptz not null default now(),
  watched_seconds int not null default 0,
  notes           text,
  primary key (user_id, milestone_id)
);

-- RLS
alter table public.climb_milestones enable row level security;
create policy "climb_public_read"
  on public.climb_milestones for select using (published = true);
create policy "climb_admin_modify"
  on public.climb_milestones for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.user_climb_progress enable row level security;
create policy "climb_progress_owner"
  on public.user_climb_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "climb_progress_admin_read"
  on public.user_climb_progress for select using (public.is_admin());

-- Touch trigger
create or replace function public.touch_climb()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists climb_touch on public.climb_milestones;
create trigger climb_touch before update on public.climb_milestones
  for each row execute function public.touch_climb();

-- Seed a handful of milestones so the UI works on day one.
insert into public.climb_milestones (slug, title, summary, position, audience, cta_label, cta_url, duration_min) values
  ('basecamp',          'Basecamp',         'Welcome to The Climb. Set up your profile and pick a starting goal.', 0, 'all', 'Open profile', '/dashboard/profile', 5),
  ('terrain-survey',    'Terrain survey',   'Audit your current presence: socials, content cadence, brand colors.', 1, 'all', 'Edit profile', '/dashboard/profile', 10),
  ('first-camp',        'First camp',       'Generate your brand mark and lock in colors.', 2, 'talent', 'Open Brand Studio', '/dashboard/brand-design', 20),
  ('signal-fire',       'Signal fire',      'Launch your personal site so brands can find you.', 3, 'talent', 'Open Site Builder', '/dashboard/sites', 25),
  ('the-first-deal',    'The first deal',   'Post your first opportunity and start the inbound flow.', 4, 'all', 'Post opportunity', '/dashboard/opportunities/new', 15),
  ('ridge-line',        'Ridge line',       'Turn on tip jar + memberships so fans can support you directly.', 5, 'talent', 'Edit your site', '/dashboard/sites', 20),
  ('high-altitude',     'High altitude',    'Set up payouts so revenue actually lands.', 6, 'talent', 'Open Payouts', '/dashboard/payouts', 15),
  ('the-summit',        'The summit',       'You''re NIL-ready. Reflect, share your win, and plan the descent (long-term plays).', 7, 'all', 'Browse services', '/services', 5)
on conflict (slug) do nothing;
