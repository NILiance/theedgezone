-- ============================================================================
-- Resources Library
-- ============================================================================
-- Free downloadable resources scoped by audience (talent / brand / all).
-- Public read on published rows; admin-only write.

create table if not exists public.resource_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  icon        text,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.resources (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  description     text,
  category_id     uuid references public.resource_categories(id) on delete set null,
  audience        text not null default 'all',
  -- one of: talent | brand | all
  file_url        text,
  thumbnail_url   text,
  external_url    text,
  download_count  int not null default 0,
  view_count      int not null default 0,
  published       boolean not null default true,
  featured        boolean not null default false,
  position        int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users(id) on delete set null
);
create index if not exists resources_category_idx on public.resources (category_id, position);
create index if not exists resources_audience_idx on public.resources (audience, published);

alter table public.resource_categories enable row level security;
create policy "categories_public_read"
  on public.resource_categories for select using (true);
create policy "categories_admin_modify"
  on public.resource_categories for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.resources enable row level security;
create policy "resources_public_read"
  on public.resources for select using (published = true);
create policy "resources_admin_modify"
  on public.resources for all
  using (public.is_admin()) with check (public.is_admin());

-- Seed a few starter categories so the admin tab isn't empty on first open.
insert into public.resource_categories (slug, name, description, icon, position) values
  ('guides',     'Guides',     'Step-by-step playbooks for talent and brands', '📚', 0),
  ('templates',  'Templates',  'Contract examples, brand kit templates, intake forms', '📋', 1),
  ('checklists', 'Checklists', 'Launch checklists, compliance checklists, prep lists', '✅', 2),
  ('tools',      'Tools',      'Calculators, planners, branding worksheets', '🛠️', 3)
on conflict (slug) do nothing;
