-- ============================================================================
-- Talent Apps — mobile app builder
-- ============================================================================
-- Talents configure a simple React Native (Expo) app per purchase. The
-- generator endpoint downloads a per-app ZIP they (or their dev) can build
-- in Expo. v1 keeps everything in two tables: talent_apps with a screens[]
-- jsonb, and a separate talent_app_orders for in-app purchases (deferred).

create table if not exists public.talent_apps (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  order_id             uuid references public.orders(id) on delete set null,
  slug                 text not null,
  name                 text not null,
  tagline              text,
  description          text,
  package_id           text,
  -- iOS bundle id / Android package id, e.g. com.mybrand.app
  icon_url             text,
  splash_url           text,
  primary_color        text not null default '#C8A84E',
  secondary_color      text not null default '#000000',
  theme_mode           text not null default 'dark',
  -- one of: dark | light
  screens              jsonb not null default '[]'::jsonb,
  -- Each screen: { id, title, icon, type (home|list|web|text|profile|tip), content }
  settings             jsonb not null default '{}'::jsonb,
  -- Sundries: { contact_email, push_enabled, supports_in_app_purchases }
  status               text not null default 'draft',
  -- one of: draft | building | ready | submitted | published
  privacy_policy_url   text,
  last_build_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (user_id, slug)
);
create index if not exists talent_apps_user_idx on public.talent_apps (user_id, created_at desc);

alter table public.talent_apps enable row level security;
create policy "talent_apps_owner_all"
  on public.talent_apps for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "talent_apps_admin_read"
  on public.talent_apps for select using (public.is_admin());

create or replace function public.touch_talent_app()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists talent_apps_touch on public.talent_apps;
create trigger talent_apps_touch before update on public.talent_apps
  for each row execute function public.touch_talent_app();
