-- ============================================================================
-- Phase 8 — Brand Design Studio
-- ============================================================================

-- One brand per athlete-purchase. Each brand can host multiple logos
-- (the legacy supports multi-logo with one ACTIVE at a time).
create table public.brand_designs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  order_id        uuid references public.orders(id) on delete set null,

  -- Basics captured from profile + intake form
  brand_name      text,
  sport           text,
  athletic_position text,
  jersey_number   text,
  school          text,
  mascot          text,
  conference      text,

  -- Preferences
  brand_tone      text,
  primary_color   text,
  secondary_color text,
  style_seed      text,                      -- 'bold', 'minimal', 'classic', 'modern', etc.

  -- State
  status          text not null default 'concept',
                                              -- concept | shortlisted | refining | finalizing | completed
  active_logo_id  uuid,                       -- references logos(id) once selected
  asset_credits_used int not null default 0,
  asset_credits_total int not null default 10,
  logo_concept_credits int not null default 0, -- batches purchased beyond first 20

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index brand_designs_user_idx on public.brand_designs (user_id, created_at desc);
create index brand_designs_status_idx on public.brand_designs (status);

alter table public.brand_designs enable row level security;

create policy "brand_designs_select_own"
  on public.brand_designs for select
  using (auth.uid() = user_id or public.is_admin());

create policy "brand_designs_modify_own"
  on public.brand_designs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger brand_designs_updated_at
  before update on public.brand_designs
  for each row execute function public.set_updated_at();

-- Logo concepts: every concept ever generated for a brand.
-- A round of 20 produces 20 rows with round=1, etc.
create table public.logo_concepts (
  id              uuid primary key default gen_random_uuid(),
  brand_design_id uuid not null references public.brand_designs(id) on delete cascade,
  round           int not null check (round between 1 and 3),
  prompt          text,
  provider        text not null default 'ideogram', -- ideogram | dall-e | replicate | other
  image_url       text not null,
  thumbnail_url   text,
  is_shortlisted  boolean not null default false,
  is_selected     boolean not null default false,
  parent_concept_id uuid references public.logo_concepts(id) on delete set null,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index logo_concepts_brand_round_idx on public.logo_concepts (brand_design_id, round);
create index logo_concepts_shortlisted_idx on public.logo_concepts (brand_design_id) where is_shortlisted = true;
create index logo_concepts_selected_idx on public.logo_concepts (brand_design_id) where is_selected = true;

alter table public.logo_concepts enable row level security;

-- Inherit access from the parent brand_design
create policy "logo_concepts_select_own"
  on public.logo_concepts for select
  using (
    exists (
      select 1 from public.brand_designs b
      where b.id = brand_design_id
        and (b.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "logo_concepts_modify_own"
  on public.logo_concepts for all
  using (
    exists (
      select 1 from public.brand_designs b
      where b.id = brand_design_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.brand_designs b
      where b.id = brand_design_id and b.user_id = auth.uid()
    )
  );

-- Final brand assets (files + URLs) once a brand is completed.
create table public.brand_assets (
  id              uuid primary key default gen_random_uuid(),
  brand_design_id uuid not null references public.brand_designs(id) on delete cascade,
  asset_type      text not null,   -- 'logo_png' | 'logo_png_transparent' | 'logo_svg' | 'brand_guide_pdf' | etc.
  size_px         int,
  background      text,            -- 'white' | 'black' | null (transparent)
  url             text not null,
  drive_file_id   text,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index brand_assets_brand_idx on public.brand_assets (brand_design_id, asset_type);

alter table public.brand_assets enable row level security;

create policy "brand_assets_select_own"
  on public.brand_assets for select
  using (
    exists (
      select 1 from public.brand_designs b
      where b.id = brand_design_id
        and (b.user_id = auth.uid() or public.is_admin())
    )
  );
