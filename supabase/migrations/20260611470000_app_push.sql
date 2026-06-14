-- Device tokens registered from a talent's app instance.
create table if not exists public.app_push_devices (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.talent_apps(id) on delete cascade,
  expo_push_token text not null,
  platform text check (platform in ('ios', 'android', 'web')),
  device_label text,
  app_version text,
  locale text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (app_id, expo_push_token)
);
create index if not exists app_push_devices_app_idx on public.app_push_devices (app_id) where revoked_at is null;
alter table public.app_push_devices enable row level security;
create policy "app_push_devices owner read"
  on public.app_push_devices for select
  to authenticated using (
    exists (select 1 from public.talent_apps a where a.id = app_push_devices.app_id and a.user_id = auth.uid())
  );
create policy "app_push_devices admin all"
  on public.app_push_devices for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Push messages composed by the talent (drafts, scheduled, sent).
create table if not exists public.app_push_messages (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.talent_apps(id) on delete cascade,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  delivered_count integer not null default 0,
  failed_count integer not null default 0,
  expo_ticket_ids jsonb,
  error text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_push_messages_app_idx on public.app_push_messages (app_id, created_at desc);
alter table public.app_push_messages enable row level security;
create policy "app_push_messages owner all"
  on public.app_push_messages for all
  to authenticated using (
    exists (select 1 from public.talent_apps a where a.id = app_push_messages.app_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.talent_apps a where a.id = app_push_messages.app_id and a.user_id = auth.uid())
  );
create policy "app_push_messages admin all"
  on public.app_push_messages for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- In-app purchase product catalog per app.
create table if not exists public.app_iap_products (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.talent_apps(id) on delete cascade,
  product_id text not null,
  display_name text not null,
  description text,
  price_usd numeric not null check (price_usd >= 0),
  kind text not null default 'consumable' check (kind in ('consumable', 'non_consumable', 'subscription')),
  apple_product_id text,
  google_product_id text,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'active', 'paused')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_id, product_id)
);
alter table public.app_iap_products enable row level security;
create policy "app_iap_products owner all"
  on public.app_iap_products for all
  to authenticated using (
    exists (select 1 from public.talent_apps a where a.id = app_iap_products.app_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.talent_apps a where a.id = app_iap_products.app_id and a.user_id = auth.uid())
  );
create policy "app_iap_products admin all"
  on public.app_iap_products for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
