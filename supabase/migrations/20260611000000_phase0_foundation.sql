-- ============================================================================
-- Phase 0 — Foundation
-- Identity, authorization, audit, custom domains, webhook idempotency.
-- All other module schemas (marketplace, fulfillment, brands, etc.) are added
-- in later phase migrations. See SCHEMA.md for the full map.
-- ============================================================================

-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ─── Shared trigger functions ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Roles ──────────────────────────────────────────────────────────────────
create type public.app_role as enum (
  'athlete',
  'vendor',
  'admin',
  'climb_admin'
);

-- ─── profiles: extends auth.users ───────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  crm_contact_id text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── user_roles: many-to-many ───────────────────────────────────────────────
create table public.user_roles (
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.app_role not null,
  granted_at  timestamptz not null default now(),
  granted_by  uuid references auth.users(id),
  primary key (user_id, role)
);

create index user_roles_role_idx on public.user_roles (role);

-- Helper for RLS: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ─── audit_log: state-changing actions ──────────────────────────────────────
create table public.audit_log (
  id            bigserial primary key,
  user_id       uuid references auth.users(id) on delete set null,
  action        text not null,
  resource_type text,
  resource_id   text,
  metadata      jsonb,
  ip            inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index audit_log_user_time_idx on public.audit_log (user_id, created_at desc);
create index audit_log_resource_idx on public.audit_log (resource_type, resource_id);
create index audit_log_action_time_idx on public.audit_log (action, created_at desc);

-- ─── custom_domains: O(1) host → resource lookup ────────────────────────────
create type public.domain_target as enum (
  'site',
  'epk',
  'podcast',
  'store',
  'app'
);

create table public.custom_domains (
  domain            citext primary key,
  target_type       public.domain_target not null,
  target_slug       text not null,
  user_id           uuid references auth.users(id) on delete cascade,
  vercel_domain_id  text,
  cert_status       text not null default 'pending',
  verified_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index custom_domains_target_idx on public.custom_domains (target_type, target_slug);
create index custom_domains_user_idx on public.custom_domains (user_id);

create trigger custom_domains_updated_at
  before update on public.custom_domains
  for each row execute function public.set_updated_at();

-- ─── stripe_events: webhook idempotency ─────────────────────────────────────
create table public.stripe_events (
  id                text primary key,        -- Stripe event ID (evt_...)
  type              text not null,
  payload           jsonb not null,
  received_at       timestamptz not null default now(),
  processed_at      timestamptz,
  processing_error  text
);

create index stripe_events_type_time_idx on public.stripe_events (type, received_at desc);
create index stripe_events_unprocessed_idx on public.stripe_events (received_at) where processed_at is null;

-- ─── email_log: Resend delivery tracking ────────────────────────────────────
create table public.email_log (
  id            uuid primary key default gen_random_uuid(),
  resend_id     text,
  to_address    text not null,
  from_address  text not null,
  subject       text not null,
  template_key  text,
  metadata      jsonb,
  status        text not null default 'queued',  -- queued | sent | delivered | bounced | failed
  sent_at       timestamptz,
  delivered_at  timestamptz,
  bounced_at    timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);

create index email_log_to_time_idx on public.email_log (to_address, created_at desc);
create index email_log_template_idx on public.email_log (template_key, created_at desc);
create index email_log_status_idx on public.email_log (status, created_at desc);

-- ─── feature_flags: safe rollout ────────────────────────────────────────────
create table public.feature_flags (
  key                 text primary key,
  enabled             boolean not null default false,
  description         text,
  rollout_percentage  int not null default 0 check (rollout_percentage between 0 and 100),
  updated_at          timestamptz not null default now()
);

create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.set_updated_at();

-- ─── Auto-create profile on signup ──────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- Server actions using SUPABASE_SERVICE_ROLE_KEY bypass these policies.
-- ============================================================================

alter table public.profiles        enable row level security;
alter table public.user_roles      enable row level security;
alter table public.audit_log       enable row level security;
alter table public.custom_domains  enable row level security;
alter table public.stripe_events   enable row level security;
alter table public.email_log       enable row level security;
alter table public.feature_flags   enable row level security;

-- profiles: public-readable, owner-writable
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- user_roles: read own; admins read all
create policy "user_roles_select_own"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

-- audit_log: admins only
create policy "audit_log_select_admin"
  on public.audit_log for select
  using (public.is_admin());

-- custom_domains: owner + admin read
create policy "custom_domains_select_own"
  on public.custom_domains for select
  using (auth.uid() = user_id or public.is_admin());

create policy "custom_domains_insert_own"
  on public.custom_domains for insert
  with check (auth.uid() = user_id);

create policy "custom_domains_update_own"
  on public.custom_domains for update
  using (auth.uid() = user_id);

create policy "custom_domains_delete_own"
  on public.custom_domains for delete
  using (auth.uid() = user_id);

-- feature_flags: anyone authenticated can read (for client-side flag checks);
-- writes are service-role only.
create policy "feature_flags_select_authenticated"
  on public.feature_flags for select
  to authenticated
  using (true);

-- stripe_events, email_log: no policies = service-role only. Intentional.

-- ─── Seed: a default admin role grant for the first user (optional, manual) ─
-- Run this once from the SQL editor after creating your admin user:
--   insert into public.user_roles (user_id, role)
--   values ('<your-user-uuid>', 'admin');
