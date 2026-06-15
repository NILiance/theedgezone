-- Talent-side 'Request a quote' for a generated brand asset (Sport
-- Uniform mockup, Merch Lab item, Photo with logo, etc). Admins
-- triage these in /dashboard/admin/brand-quotes and respond with
-- pricing + fulfillment.

create table if not exists brand_asset_quote_requests (
  id uuid primary key default gen_random_uuid(),
  brand_design_id uuid not null references brand_designs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Optional addon link — null when the asset has been deleted but the
  -- quote is still in flight.
  addon_id uuid references brand_design_addons(id) on delete set null,
  addon_kind text,
  addon_url text,
  quantity integer,
  sizes text,
  delivery_address text,
  notes text,
  contact_email text,
  contact_phone text,
  status text not null default 'pending',  -- pending | quoted | accepted | declined
  quoted_amount_cents integer,
  quoted_at timestamptz,
  quoted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists brand_asset_quote_requests_brand_idx
  on brand_asset_quote_requests (brand_design_id);
create index if not exists brand_asset_quote_requests_status_idx
  on brand_asset_quote_requests (status);

alter table brand_asset_quote_requests enable row level security;

drop policy if exists "quote requests: owner read" on brand_asset_quote_requests;
create policy "quote requests: owner read"
  on brand_asset_quote_requests for select
  using (user_id = auth.uid());

drop policy if exists "quote requests: owner insert" on brand_asset_quote_requests;
create policy "quote requests: owner insert"
  on brand_asset_quote_requests for insert
  with check (user_id = auth.uid());

drop policy if exists "quote requests: admin all" on brand_asset_quote_requests;
create policy "quote requests: admin all"
  on brand_asset_quote_requests for all
  using (
    exists(select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
  )
  with check (
    exists(select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
  );
