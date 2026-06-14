-- ============================================================================
-- Polish round — permissions matrix + Phyllo OAuth fields
-- ============================================================================

-- Role-based permissions matrix. Each row = (role, capability, allowed).
create table if not exists public.role_permissions (
  role         text not null,
  -- one of: talent | brand | admin
  capability   text not null,
  allowed      boolean not null default false,
  description  text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users(id) on delete set null,
  primary key (role, capability)
);

alter table public.role_permissions enable row level security;
create policy "role_permissions_public_read"
  on public.role_permissions for select using (true);
create policy "role_permissions_admin_modify"
  on public.role_permissions for all
  using (public.is_admin()) with check (public.is_admin());

-- Seed the canonical capability list per role.
insert into public.role_permissions (role, capability, allowed, description) values
  ('talent', 'site.create',                true,  'Create a personal website'),
  ('talent', 'brand-design.create',        true,  'Open Brand Design Studio'),
  ('talent', 'epk.create',                 true,  'Create an EPK'),
  ('talent', 'app.create',                 true,  'Generate a mobile app'),
  ('talent', 'store.create',               true,  'Open an NIL store'),
  ('talent', 'opportunity.post',           true,  'Post opportunities to NILiance'),
  ('talent', 'roadmap.toggle',             true,  'Mark roadmap items complete'),
  ('talent', 'payouts.connect',            true,  'Set up Stripe Connect payouts'),
  ('talent', 'support.create',             true,  'File support tickets'),
  ('brand',  'opportunity.post',           true,  'Post opportunities visible to talent'),
  ('brand',  'support.create',             true,  'File support tickets'),
  ('brand',  'site.create',                false, 'Brands typically don''t need a site builder'),
  ('admin',  'pricing.manage',             true,  'Edit catalog pricing'),
  ('admin',  'orders.manage',              true,  'View + modify orders'),
  ('admin',  'enrollment.manage',          true,  'Bulk-enroll talents'),
  ('admin',  'resources.manage',           true,  'Manage the resource library'),
  ('admin',  'roadmap.manage',             true,  'Edit the roadmap structure'),
  ('admin',  'climb.manage',               true,  'Edit Climb milestones'),
  ('admin',  'brand-clients.manage',       true,  'Manage external brand customers'),
  ('admin',  'tickets.manage',             true,  'Triage all tickets'),
  ('admin',  'users.manage',               true,  'View + edit + suspend users')
on conflict (role, capability) do nothing;

-- Phyllo creator-identity link
alter table public.profiles
  add column if not exists phyllo_user_id text,
  add column if not exists phyllo_connected_at timestamptz;
