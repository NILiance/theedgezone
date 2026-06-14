-- ============================================================================
-- Brand-Customer Portal — for external brand clients (not Supabase auth users)
-- ============================================================================
-- Brand clients are external companies/individuals who purchased a brand
-- pack from us. They access the portal via a magic-link token instead
-- of password auth. Tokens persist in a cookie for 30 days.

create table if not exists public.brand_clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact_email   text not null,
  company         text,
  notes           text,
  status          text not null default 'active',
  -- one of: active | archived
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists brand_clients_email_idx
  on public.brand_clients (lower(contact_email));

-- Magic-link tokens. Multiple can be valid at once (e.g., one per email send).
create table if not exists public.brand_client_tokens (
  token         text primary key,
  brand_client_id uuid not null references public.brand_clients(id) on delete cascade,
  expires_at    timestamptz not null,
  consumed_at   timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists brand_client_tokens_client_idx
  on public.brand_client_tokens (brand_client_id);

-- Files uploaded for a client. Stored in Supabase Storage; we track URL +
-- metadata here so the portal can list them without scanning the bucket.
create table if not exists public.brand_client_assets (
  id            uuid primary key default gen_random_uuid(),
  brand_client_id uuid not null references public.brand_clients(id) on delete cascade,
  kind          text not null default 'file',
  -- one of: file | image | pdf | brand_kit_zip | other
  filename      text not null,
  url           text not null,
  size_bytes    bigint,
  description   text,
  uploaded_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists brand_client_assets_client_idx
  on public.brand_client_assets (brand_client_id, created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────
-- Brand clients are NOT Supabase auth users, so we can't gate via auth.uid().
-- Admin can do everything; public has no direct read access.
-- The portal pages use the service-role client after verifying the cookie
-- token, so no public RLS policy is needed.
alter table public.brand_clients enable row level security;
create policy "brand_clients_admin"
  on public.brand_clients for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.brand_client_tokens enable row level security;
create policy "brand_client_tokens_admin"
  on public.brand_client_tokens for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.brand_client_assets enable row level security;
create policy "brand_client_assets_admin"
  on public.brand_client_assets for all
  using (public.is_admin()) with check (public.is_admin());

-- Touch trigger
create or replace function public.touch_brand_client()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists brand_clients_touch on public.brand_clients;
create trigger brand_clients_touch before update on public.brand_clients
  for each row execute function public.touch_brand_client();
