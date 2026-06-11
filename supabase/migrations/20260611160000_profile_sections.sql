-- ============================================================================
-- Phase 4 — Profile section fields + auto-computed completion %
-- ============================================================================

alter table public.profiles
  -- BASICS
  add column if not exists phone text,
  add column if not exists street_address text,
  add column if not exists city text,
  add column if not exists us_state text,                -- 2-letter (AL..WY, DC)
  add column if not exists website_url text,
  add column if not exists weight_lbs int,
  add column if not exists hometown text,
  add column if not exists height_inches int,            -- total inches (e.g. 73)

  -- ATHLETIC
  add column if not exists sport text,
  add column if not exists athletic_position text,
  add column if not exists school text,
  add column if not exists conference text,
  add column if not exists division text,
  add column if not exists jersey_number text,
  add column if not exists date_of_birth date,

  -- BRAND
  add column if not exists brand_primary_color text,
  add column if not exists brand_secondary_color text,
  add column if not exists brand_tagline text,
  add column if not exists brand_voice text,

  -- STORY
  add column if not exists bio text,
  add column if not exists achievements text,

  -- SOCIAL — { instagram: '@x', tiktok: '@y', ... }
  add column if not exists socials jsonb not null default '{}'::jsonb,

  -- GOALS — selected keys from the 16-goal list
  add column if not exists selected_goals text[] not null default '{}',

  -- CONTACTS
  add column if not exists agency_name text,
  add column if not exists agent_name text,
  add column if not exists agent_email text,
  add column if not exists agent_phone text;

-- Auto-compute profile completion % whenever the profile row is written
create or replace function public.compute_profile_completion(p public.profiles)
returns int
language plpgsql
stable
as $$
declare
  basics_filled int := 0;
  athletic_filled int := 0;
  brand_filled int := 0;
  story_filled int := 0;
  social_filled int := 0;
begin
  -- BASICS (10 weighted slots)
  if coalesce(p.display_name, '') <> '' then basics_filled := basics_filled + 1; end if;
  if p.phone is not null then basics_filled := basics_filled + 1; end if;
  if p.street_address is not null then basics_filled := basics_filled + 1; end if;
  if p.city is not null then basics_filled := basics_filled + 1; end if;
  if p.us_state is not null then basics_filled := basics_filled + 1; end if;
  if p.website_url is not null then basics_filled := basics_filled + 1; end if;
  if p.weight_lbs is not null then basics_filled := basics_filled + 1; end if;
  if p.hometown is not null then basics_filled := basics_filled + 1; end if;
  if p.height_inches is not null then basics_filled := basics_filled + 1; end if;
  if p.avatar_url is not null then basics_filled := basics_filled + 1; end if;

  -- ATHLETIC (7 slots)
  if p.sport is not null then athletic_filled := athletic_filled + 1; end if;
  if p.athletic_position is not null then athletic_filled := athletic_filled + 1; end if;
  if p.school is not null then athletic_filled := athletic_filled + 1; end if;
  if p.conference is not null then athletic_filled := athletic_filled + 1; end if;
  if p.division is not null then athletic_filled := athletic_filled + 1; end if;
  if p.jersey_number is not null then athletic_filled := athletic_filled + 1; end if;
  if p.date_of_birth is not null then athletic_filled := athletic_filled + 1; end if;

  -- BRAND (4 slots)
  if p.brand_primary_color is not null then brand_filled := brand_filled + 1; end if;
  if p.brand_secondary_color is not null then brand_filled := brand_filled + 1; end if;
  if p.brand_tagline is not null then brand_filled := brand_filled + 1; end if;
  if p.brand_voice is not null then brand_filled := brand_filled + 1; end if;

  -- STORY (2 slots)
  if p.bio is not null then story_filled := story_filled + 1; end if;
  if p.achievements is not null then story_filled := story_filled + 1; end if;

  -- SOCIAL (4 slots — keys present in socials jsonb)
  if p.socials ? 'instagram' then social_filled := social_filled + 1; end if;
  if p.socials ? 'tiktok' then social_filled := social_filled + 1; end if;
  if p.socials ? 'twitter' then social_filled := social_filled + 1; end if;
  if p.socials ? 'youtube' then social_filled := social_filled + 1; end if;

  return (
    (basics_filled * 10) +    -- max 100
    round(athletic_filled * 100.0 / 7) +
    (brand_filled * 25) +     -- max 100
    (story_filled * 50) +     -- max 100
    (social_filled * 25)      -- max 100
  )::int / 5;
end;
$$;

create or replace function public.set_profile_completion()
returns trigger
language plpgsql
as $$
begin
  new.profile_completion_pct := public.compute_profile_completion(new);
  return new;
end;
$$;

drop trigger if exists profiles_set_completion on public.profiles;
create trigger profiles_set_completion
  before insert or update on public.profiles
  for each row execute function public.set_profile_completion();
