create table if not exists public.digital_business_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null,
  display_name text,
  title text,
  organization text,
  tagline text,
  phone text,
  email text,
  website text,
  avatar_url text,
  logo_url text,
  socials jsonb not null default '{}'::jsonb,
  primary_color text not null default '#0a0a0a',
  secondary_color text not null default '#ffffff',
  qr_target text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (user_id, slug)
);
create index if not exists business_cards_user_idx
  on public.digital_business_cards (user_id, created_at desc);
create index if not exists business_cards_slug_idx
  on public.digital_business_cards (slug);

alter table public.digital_business_cards enable row level security;
create policy "business_cards public read published"
  on public.digital_business_cards for select
  to anon, authenticated using (status = 'published');
create policy "business_cards owner all"
  on public.digital_business_cards for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "business_cards admin all"
  on public.digital_business_cards for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
