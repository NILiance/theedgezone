-- ============================================================================
-- Phase 0.6 — Branding settings
-- Admin-controllable values (logo size, tagline) used across the public site.
-- ============================================================================

create table public.branding_settings (
  id                  int primary key default 1,
  logo_height_nav     int not null default 52,
  logo_height_footer  int not null default 36,
  tagline             text not null default 'Elevate Your Game',
  updated_at          timestamptz not null default now(),
  constraint branding_settings_singleton check (id = 1),
  constraint branding_settings_nav_range check (logo_height_nav between 16 and 200),
  constraint branding_settings_footer_range check (logo_height_footer between 16 and 200)
);

-- Seed the singleton row
insert into public.branding_settings (id) values (1) on conflict do nothing;

-- RLS
alter table public.branding_settings enable row level security;

-- Everyone (incl. unauthed) can read, since Wordmark renders for the public site.
create policy "branding_select_all"
  on public.branding_settings for select
  using (true);

-- Only admins can update.
create policy "branding_update_admin"
  on public.branding_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- Bump updated_at on change.
create trigger branding_settings_updated_at
  before update on public.branding_settings
  for each row execute function public.set_updated_at();
