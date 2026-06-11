-- ============================================================================
-- Phase 9 — Talent Site Builder
-- ============================================================================

-- One site per athlete-purchase. Slug becomes the subdomain
-- (e.g. yourname.MyTalentSite.com). Custom domains are tracked in the
-- existing custom_domains table (target_type = 'site').
create table public.sites (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  order_id        uuid references public.orders(id) on delete set null,

  slug            citext unique not null,         -- subdomain segment
  display_name    text,
  tagline         text,

  -- Theme: colors, fonts, layout density, etc.
  theme           jsonb not null default '{}'::jsonb,

  status          text not null default 'draft',   -- draft | published
  published_at    timestamptz,

  -- SEO defaults; pages can override
  default_meta    jsonb not null default '{}'::jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index sites_user_idx on public.sites (user_id, created_at desc);
create index sites_status_idx on public.sites (status);

alter table public.sites enable row level security;

create policy "sites_select_public_published"
  on public.sites for select
  using (status = 'published' or auth.uid() = user_id or public.is_admin());

create policy "sites_modify_own"
  on public.sites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger sites_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

-- Multi-page sites. Path is the URL segment (e.g. '/', '/about', '/shop').
create table public.site_pages (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  path            text not null,
  title           text not null,
  meta            jsonb not null default '{}'::jsonb,    -- meta_title, meta_description, og_image, noindex
  position        int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (site_id, path)
);

create index site_pages_site_idx on public.site_pages (site_id, position);

alter table public.site_pages enable row level security;

create policy "site_pages_select_published"
  on public.site_pages for select
  using (
    exists (
      select 1 from public.sites s
      where s.id = site_id
        and (s.status = 'published' or s.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "site_pages_modify_own"
  on public.site_pages for all
  using (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  );

create trigger site_pages_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();

-- Block-based content. Each block has a type + a props jsonb that the
-- block renderer interprets. Supported block types live in the app code.
create table public.site_blocks (
  id              uuid primary key default gen_random_uuid(),
  page_id         uuid not null references public.site_pages(id) on delete cascade,
  position        int not null default 0,
  block_type      text not null,                          -- 'hero' | 'text' | 'image' | 'gallery' | 'stats' | 'sponsors' | 'video' | 'cta' | 'contact' | ...
  props           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index site_blocks_page_idx on public.site_blocks (page_id, position);

alter table public.site_blocks enable row level security;

create policy "site_blocks_select_published"
  on public.site_blocks for select
  using (
    exists (
      select 1 from public.site_pages p
      join public.sites s on s.id = p.site_id
      where p.id = page_id
        and (s.status = 'published' or s.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "site_blocks_modify_own"
  on public.site_blocks for all
  using (
    exists (
      select 1 from public.site_pages p
      join public.sites s on s.id = p.site_id
      where p.id = page_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.site_pages p
      join public.sites s on s.id = p.site_id
      where p.id = page_id and s.user_id = auth.uid()
    )
  );

create trigger site_blocks_updated_at
  before update on public.site_blocks
  for each row execute function public.set_updated_at();
