-- Climb "Platform Reel" — a curated, auto-advancing sequence of milestone
-- narrator videos (the native replacement for the legacy Cloudinary-stitched
-- sizzle reel). One singleton row; admin picks + orders which milestones play.

create table if not exists public.climb_reel (
  id            uuid primary key default gen_random_uuid(),
  -- Enforces a single row: only one platform reel exists.
  singleton     boolean not null default true unique,
  title         text not null default 'Path to the Summit',
  subtitle      text,
  -- Ordered array of milestone id strings (resolved to current video at render).
  milestone_ids jsonb not null default '[]'::jsonb,
  published     boolean not null default false,
  updated_at    timestamptz not null default now()
);

alter table public.climb_reel enable row level security;

drop policy if exists "climb_reel public read" on public.climb_reel;
create policy "climb_reel public read"
  on public.climb_reel for select using (published = true);

drop policy if exists "climb_reel admin all" on public.climb_reel;
create policy "climb_reel admin all"
  on public.climb_reel for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed the single reel row.
insert into public.climb_reel (singleton) values (true)
on conflict (singleton) do nothing;
