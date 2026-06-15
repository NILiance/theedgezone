-- Personal Brand Toolkit — generated coaching content per section. The
-- talent's profile (name, sport, school, goals, tagline, social handles)
-- feeds the prompt; the result is cached so a re-open shows the same
-- content unless the talent explicitly regenerates.

create table if not exists brand_toolkit_entries (
  id uuid primary key default gen_random_uuid(),
  brand_design_id uuid not null references brand_designs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 'launch' | 'nil_deals' | 'content' | 'growth' | 'protection' | etc.
  section_id text not null,
  content_md text not null,
  model_used text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_design_id, section_id)
);

create index if not exists brand_toolkit_entries_brand_idx
  on brand_toolkit_entries (brand_design_id);

alter table brand_toolkit_entries enable row level security;

drop policy if exists "toolkit: owner all" on brand_toolkit_entries;
create policy "toolkit: owner all"
  on brand_toolkit_entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "toolkit: admin all" on brand_toolkit_entries;
create policy "toolkit: admin all"
  on brand_toolkit_entries for all
  using (
    exists(select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
  )
  with check (
    exists(select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
  );
