-- ============================================================================
-- Phase 9b v2-H — analytics + short links + affiliates
-- ============================================================================
-- (site_subscribers already exists from v2-A; this round adds the UI/CSV.)

-- ── Per-page view tracking ─────────────────────────────────────────────────
create table if not exists public.site_page_views (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  page_id         uuid references public.site_pages(id) on delete set null,
  path            text not null,
  ip_hash         text,                                -- hashed in app (never store raw)
  user_agent      text,
  referrer        text,
  country         text,
  created_at      timestamptz not null default now()
);
create index if not exists site_views_site_idx
  on public.site_page_views (site_id, created_at desc);
create index if not exists site_views_page_idx
  on public.site_page_views (page_id, created_at desc);

alter table public.site_page_views enable row level security;
create policy "site_views_owner_read"
  on public.site_page_views for select
  using (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  );
create policy "site_views_public_insert"
  on public.site_page_views for insert
  with check (true);

-- Daily roll-up materialized via a server query (no MV — small enough to
-- compute on demand for the analytics dashboard).

-- ── Short links ────────────────────────────────────────────────────────────
create table if not exists public.site_short_links (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  slug            text not null,                       -- /go/{slug}
  target_url      text not null,
  title           text,
  clicks          int not null default 0,
  last_clicked_at timestamptz,
  created_at      timestamptz not null default now(),
  unique (site_id, slug)
);
create index if not exists site_short_links_lookup_idx
  on public.site_short_links (site_id, slug);

alter table public.site_short_links enable row level security;
create policy "site_short_links_owner_modify"
  on public.site_short_links for all
  using (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  );
-- Public read so the /go/[slug] redirect can resolve without service role.
create policy "site_short_links_public_read"
  on public.site_short_links for select
  using (true);

-- ── Affiliates ─────────────────────────────────────────────────────────────
create table if not exists public.site_affiliates (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  name            text not null,
  email           text,
  code            text not null,                       -- ?ref=code attribution token
  lifetime_revenue_cents bigint not null default 0,
  signups         int not null default 0,
  clicks          int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (site_id, code)
);
create index if not exists site_affiliates_site_idx on public.site_affiliates (site_id);
create index if not exists site_affiliates_code_idx on public.site_affiliates (code);

alter table public.site_affiliates enable row level security;
create policy "site_affiliates_owner_modify"
  on public.site_affiliates for all
  using (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  );
-- Public select on (site_id, code) so the referral cookie can validate.
create policy "site_affiliates_public_lookup"
  on public.site_affiliates for select
  using (true);

-- ── Affiliate magic-link tokens ────────────────────────────────────────────
-- Affiliates aren't full users; they get short-lived bearer tokens via email
-- to view their stats. Tokens TTL via expires_at filtering at read time.
create table if not exists public.site_affiliate_tokens (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid not null references public.site_affiliates(id) on delete cascade,
  token           text not null unique,
  expires_at      timestamptz not null,
  consumed_at     timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.site_affiliate_tokens enable row level security;
-- No public select — server actions handle reads via the service role.
