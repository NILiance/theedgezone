-- Revision request table — every paid (or free first) revision the talent
-- asks for on a finalized brand design. Admin works through this queue and
-- attaches the revised concept image when ready.

create table if not exists brand_design_revisions (
  id uuid primary key default gen_random_uuid(),
  brand_design_id uuid not null references brand_designs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notes text,
  source text not null default 'paid',  -- 'free' | 'paid' | 'admin'
  stripe_session_id text,
  amount_cents integer not null default 0,
  status text not null default 'pending',  -- pending | delivered | cancelled
  delivered_concept_url text,
  delivered_at timestamptz,
  delivered_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists brand_design_revisions_brand_idx
  on brand_design_revisions (brand_design_id);
create index if not exists brand_design_revisions_status_idx
  on brand_design_revisions (status);

alter table brand_design_revisions enable row level security;

drop policy if exists "revisions: owner read" on brand_design_revisions;
create policy "revisions: owner read"
  on brand_design_revisions for select
  using (user_id = auth.uid());

drop policy if exists "revisions: owner insert" on brand_design_revisions;
create policy "revisions: owner insert"
  on brand_design_revisions for insert
  with check (user_id = auth.uid());

drop policy if exists "revisions: admin all" on brand_design_revisions;
create policy "revisions: admin all"
  on brand_design_revisions for all
  using (
    exists(
      select 1 from user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists(
      select 1 from user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );
