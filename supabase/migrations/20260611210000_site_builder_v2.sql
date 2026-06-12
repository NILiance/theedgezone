-- ============================================================================
-- Phase 9b v2 — Site builder schema extensions
-- ============================================================================
-- Extends sites with header/footer/social/layout config so the full legacy
-- builder feature surface (47 block types, 23 theme presets, 13 site
-- templates, 10 layouts) can be replicated.

alter table public.sites
  add column if not exists header jsonb not null default '{}'::jsonb,
  add column if not exists footer jsonb not null default '{}'::jsonb,
  add column if not exists social jsonb not null default '{}'::jsonb,
  add column if not exists layout text default 'classic',
  add column if not exists template_id text,
  add column if not exists onboarding_complete boolean not null default false;

-- Page-level access + nav metadata used by the page list + public renderer.
alter table public.site_pages
  add column if not exists status text not null default 'published',
  add column if not exists nav_visible boolean not null default true,
  add column if not exists nav_label text,
  add column if not exists nav_parent uuid references public.site_pages(id) on delete set null,
  add column if not exists page_type text default 'custom',
  add column if not exists required_level int not null default 0,
  add column if not exists early_access_hours int not null default 0,
  add column if not exists supporters_only boolean not null default false,
  add column if not exists seo jsonb not null default '{}'::jsonb;

create index if not exists site_pages_nav_parent_idx
  on public.site_pages (nav_parent)
  where nav_parent is not null;

-- Named galleries reusable across pages.
create table if not exists public.site_galleries (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  name            text not null,
  images          jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (site_id, name)
);
create index if not exists site_galleries_site_idx on public.site_galleries (site_id);
alter table public.site_galleries enable row level security;
create policy "site_galleries_select_owner_or_public"
  on public.site_galleries for select
  using (
    exists (
      select 1 from public.sites s
      where s.id = site_id and (s.user_id = auth.uid() or s.status = 'published' or public.is_admin())
    )
  );
create policy "site_galleries_modify_own"
  on public.site_galleries for all
  using (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  );

-- Custom theme presets per user (separate from built-ins which live in code).
create table if not exists public.user_theme_presets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  tokens          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (user_id, name)
);
alter table public.user_theme_presets enable row level security;
create policy "user_theme_presets_owner_only"
  on public.user_theme_presets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Email subscribers captured from email_capture blocks.
create table if not exists public.site_subscribers (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  email           text not null,
  source          text,
  created_at      timestamptz not null default now(),
  unique (site_id, email)
);
create index if not exists site_subscribers_site_idx on public.site_subscribers (site_id);
alter table public.site_subscribers enable row level security;
create policy "site_subscribers_owner_read"
  on public.site_subscribers for select
  using (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  );
create policy "site_subscribers_public_insert"
  on public.site_subscribers for insert
  with check (true);

-- Contact form submissions.
create table if not exists public.site_submissions (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  page_id         uuid references public.site_pages(id) on delete set null,
  block_id        uuid references public.site_blocks(id) on delete set null,
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists site_submissions_site_idx on public.site_submissions (site_id);
alter table public.site_submissions enable row level security;
create policy "site_submissions_owner_read"
  on public.site_submissions for select
  using (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  );
create policy "site_submissions_public_insert"
  on public.site_submissions for insert
  with check (true);
