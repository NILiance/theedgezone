-- ============================================================================
-- NIL Roadmap — phases, items, per-user progress
-- ============================================================================

create table if not exists public.roadmap_phases (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  description  text,
  icon         text,
  position     int not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.roadmap_items (
  id                           uuid primary key default gen_random_uuid(),
  phase_id                     uuid references public.roadmap_phases(id) on delete cascade,
  slug                         text unique not null,
  name                         text not null,
  description                  text,
  audience                     text not null default 'all',
  -- one of: all | talent | brand
  position                     int not null default 0,
  recommended_action_url       text,
  recommended_action_label     text,
  published                    boolean not null default true,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);
create index if not exists roadmap_items_phase_idx on public.roadmap_items (phase_id, position);

alter table public.roadmap_phases enable row level security;
alter table public.roadmap_items enable row level security;

create policy "roadmap_phases_public_read"
  on public.roadmap_phases for select using (published = true);
create policy "roadmap_phases_admin_modify"
  on public.roadmap_phases for all
  using (public.is_admin()) with check (public.is_admin());

create policy "roadmap_items_public_read"
  on public.roadmap_items for select using (published = true);
create policy "roadmap_items_admin_modify"
  on public.roadmap_items for all
  using (public.is_admin()) with check (public.is_admin());

-- Per-user progress
create table if not exists public.user_roadmap_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  item_id      uuid not null references public.roadmap_items(id) on delete cascade,
  completed_at timestamptz not null default now(),
  notes        text,
  primary key (user_id, item_id)
);
create index if not exists user_roadmap_progress_user_idx
  on public.user_roadmap_progress (user_id);

alter table public.user_roadmap_progress enable row level security;
create policy "roadmap_progress_owner"
  on public.user_roadmap_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "roadmap_progress_admin_read"
  on public.user_roadmap_progress for select
  using (public.is_admin());

-- Seed phases so the admin tab isn't empty on first open.
insert into public.roadmap_phases (slug, name, description, icon, position) values
  ('foundation', 'Foundation',           'Set up your identity, profile, and brand basics.', '🧱', 0),
  ('momentum',   'Momentum',              'Launch the assets that make brands want to talk to you.', '🚀', 1),
  ('scale',      'Scale',                 'Grow audience, deals, and recurring revenue.',     '📈', 2),
  ('legacy',     'Legacy',                'Plan beyond NIL — endorsements, ownership, payouts.', '🏆', 3)
on conflict (slug) do nothing;

insert into public.roadmap_items (phase_id, slug, name, description, position, recommended_action_url, recommended_action_label)
select p.id, x.slug, x.name, x.description, x.position, x.url, x.label
from public.roadmap_phases p
join (values
  ('foundation', 'complete-profile',     'Complete your profile',          'Fill in sport, school, position, social handles, and brand colors.', 0, '/dashboard/profile', 'Open profile'),
  ('foundation', 'set-brand-colors',     'Set your brand colors',          'Pick a primary + secondary color. This drives every asset.',         1, '/dashboard/profile', 'Edit colors'),
  ('foundation', 'generate-brand-mark',  'Generate a brand mark',          'Use the Brand Design Studio to create your first logo concept.',     2, '/dashboard/brand-design', 'Open Brand Studio'),
  ('momentum',   'launch-personal-site', 'Launch your personal site',     'Spin up a Personal Website at slug.mytalentsite.com.',              0, '/dashboard/sites', 'Open Site Builder'),
  ('momentum',   'add-revenue-blocks',   'Turn on revenue blocks',         'Add Tip Jar, Membership Tiers, or Merch to your site.',             1, '/dashboard/sites', 'Edit site'),
  ('momentum',   'connect-payouts',      'Set up payouts',                 'Onboard Stripe Connect so you can cash out.',                       2, '/dashboard/payouts', 'Open Payouts'),
  ('scale',      'post-opportunity',     'Post your first NIL opportunity', 'Tell brands what you''re open to. Goes to NILiance + /opportunities.', 0, '/dashboard/opportunities/new', 'Post opportunity'),
  ('scale',      'recruit-affiliates',   'Recruit affiliates',             'Add referral partners so your reach compounds.',                    1, '/dashboard/sites', 'Open Insights → Affiliates'),
  ('legacy',     'browse-services',      'Explore long-term services',    'Move from one-off deals to ownership, equity, and brand-of-one work.', 0, '/services', 'Browse catalog')
) as x(phase_slug, slug, name, description, position, url, label)
  on p.slug = x.phase_slug
on conflict (slug) do nothing;
