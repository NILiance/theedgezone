-- Print Shop catalog (admin-curated)
create table if not exists public.print_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text not null check (category in ('banner', 'business_card', 'flyer', 'poster', 'sticker', 'apparel', 'signage', 'other')),
  cover_image_url text,
  base_price_cents integer not null check (base_price_cents > 0),
  variants jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  lead_time_days integer not null default 7,
  shippable boolean not null default true,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.print_products enable row level security;
create policy "print_products public read active"
  on public.print_products for select
  to anon, authenticated using (active = true);
create policy "print_products admin all"
  on public.print_products for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Print orders (talent-initiated, fulfilled by Edge Zone)
create table if not exists public.print_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.print_products(id) on delete restrict,
  variant_label text,
  options jsonb not null default '{}'::jsonb,
  quantity integer not null default 1 check (quantity > 0),
  amount_cents integer not null check (amount_cents >= 0),
  artwork_urls jsonb not null default '[]'::jsonb,
  ship_to_name text,
  ship_to_phone text,
  ship_to_street text,
  ship_to_city text,
  ship_to_state text,
  ship_to_postal text,
  ship_to_country text not null default 'US',
  status text not null default 'draft' check (status in ('draft', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled')),
  stripe_session_id text,
  tracking_number text,
  carrier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz
);
create index if not exists print_orders_user_idx on public.print_orders (user_id, created_at desc);
alter table public.print_orders enable row level security;
create policy "print_orders owner all"
  on public.print_orders for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "print_orders admin all"
  on public.print_orders for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Logo Mod requests (talent uploads existing logo + describes change)
create table if not exists public.logo_mod_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  original_logo_url text,
  requested_changes text not null,
  tier text not null default 'standard' check (tier in ('quick', 'standard', 'pro')),
  amount_cents integer not null default 0,
  status text not null default 'submitted' check (status in ('submitted', 'in_progress', 'review', 'delivered', 'cancelled')),
  stripe_session_id text,
  paid_at timestamptz,
  delivered_logo_urls jsonb not null default '[]'::jsonb,
  designer_notes text,
  rev_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists logo_mod_user_idx on public.logo_mod_requests (user_id, created_at desc);
alter table public.logo_mod_requests enable row level security;
create policy "logo_mod owner all"
  on public.logo_mod_requests for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "logo_mod admin all"
  on public.logo_mod_requests for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Seed three sample print products
insert into public.print_products (slug, name, description, category, base_price_cents, lead_time_days, variants, options) values
  ('vinyl-banner', 'Vinyl Banner', '13oz outdoor-rated vinyl banner with grommets at every corner. Print one side or both. Common backdrop for camp / clinic appearances.', 'banner', 4900, 5,
    '[{"label":"3x5 ft","price_cents":4900},{"label":"4x8 ft","price_cents":8900},{"label":"5x10 ft","price_cents":13900}]',
    '[{"key":"side","label":"Print sides","values":["Single","Double"]},{"key":"finish","label":"Edge","values":["Hemmed","Plain"]}]'
  ),
  ('business-cards-500', 'Premium Business Cards (500)', '16pt matte stock with optional spot UV. Two-sided full-color. Ships in 5–7 business days.', 'business_card', 7500, 7,
    '[{"label":"500 cards","price_cents":7500},{"label":"1000 cards","price_cents":11500},{"label":"2500 cards","price_cents":21000}]',
    '[{"key":"finish","label":"Finish","values":["Matte","Soft Touch","Spot UV"]},{"key":"sides","label":"Sides","values":["1-side","2-side"]}]'
  ),
  ('full-color-flyers', 'Full-Color Flyers', '100lb gloss text, two-sided full-color flyers. Great for camps, clinics, autograph signings, and team events.', 'flyer', 12500, 5,
    '[{"label":"500 / 8.5x11","price_cents":12500},{"label":"1000 / 8.5x11","price_cents":18500},{"label":"500 / 5.5x8.5","price_cents":8500}]',
    '[{"key":"sides","label":"Sides","values":["1-side","2-side"]}]'
  )
on conflict (slug) do nothing;
