-- ============================================================================
-- EPK (Electronic Press Kit) — talent's media-friendly single-page pitch
-- ============================================================================
-- Lives at *.talentepk.com (the middleware already routes subdomains for this
-- suffix). Single-page model: one row per EPK, blocks live in epk_blocks.
-- Schema deliberately mirrors sites/site_blocks so the existing editor +
-- renderer components can be reused with minimal duplication.

create table if not exists public.epks (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  order_id             uuid references public.orders(id) on delete set null,
  slug                 text not null,
  display_name         text,
  tagline              text,
  theme                jsonb not null default '{}'::jsonb,
  header               jsonb not null default '{}'::jsonb,
  footer               jsonb not null default '{}'::jsonb,
  social               jsonb not null default '{}'::jsonb,
  layout               text default 'classic',
  template_id          text,
  custom_domain        text,
  status               text not null default 'draft',
  -- one of: draft | published | archived
  published_at         timestamptz,
  onboarding_complete  boolean not null default false,
  default_meta         jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (user_id, slug)
);
create index if not exists epks_slug_idx on public.epks (slug);
create index if not exists epks_user_idx on public.epks (user_id, created_at desc);
create index if not exists epks_custom_domain_idx on public.epks (custom_domain) where custom_domain is not null;

alter table public.epks enable row level security;
create policy "epks_owner_all"
  on public.epks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "epks_public_published_read"
  on public.epks for select using (status = 'published');
create policy "epks_admin_read"
  on public.epks for select using (public.is_admin());

create table if not exists public.epk_blocks (
  id           uuid primary key default gen_random_uuid(),
  epk_id       uuid not null references public.epks(id) on delete cascade,
  position     int not null default 0,
  block_type   text not null,
  props        jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists epk_blocks_epk_idx on public.epk_blocks (epk_id, position);

alter table public.epk_blocks enable row level security;
create policy "epk_blocks_select_published_or_owner"
  on public.epk_blocks for select
  using (
    exists (
      select 1 from public.epks e
      where e.id = epk_id and (e.status = 'published' or e.user_id = auth.uid() or public.is_admin())
    )
  );
create policy "epk_blocks_modify_own"
  on public.epk_blocks for all
  using (exists (select 1 from public.epks e where e.id = epk_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.epks e where e.id = epk_id and e.user_id = auth.uid()));

create or replace function public.touch_epk()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists epks_touch on public.epks;
create trigger epks_touch before update on public.epks for each row execute function public.touch_epk();
drop trigger if exists epk_blocks_touch on public.epk_blocks;
create trigger epk_blocks_touch before update on public.epk_blocks for each row execute function public.touch_epk();
