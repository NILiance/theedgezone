-- ============================================================================
-- Phase 9b v2-C — Site assets storage bucket
-- ============================================================================
-- Holds image / video uploads for the site builder. Files are organized as
-- {user_id}/{site_id}/{filename} so RLS can keep users isolated. Public read
-- so the rendered site can serve the assets without signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  10 * 1024 * 1024,                           -- 10 MB per file
  array[
    'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
    'video/mp4','video/webm'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Storage policies ───────────────────────────────────────────────────────
-- A user owns objects whose top-level path segment matches their user id.
-- Public can read everything in the bucket (it's public).

drop policy if exists "site_assets_public_read" on storage.objects;
create policy "site_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'site-assets');

drop policy if exists "site_assets_insert_own" on storage.objects;
create policy "site_assets_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'site-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "site_assets_update_own" on storage.objects;
create policy "site_assets_update_own"
  on storage.objects for update
  using (
    bucket_id = 'site-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "site_assets_delete_own" on storage.objects;
create policy "site_assets_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'site-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Per-user uploaded asset index ──────────────────────────────────────────
-- Mirror of storage objects we care about; lets the UI list a user's uploads
-- by site without paginating storage. Auto-populated from server actions.

create table if not exists public.site_assets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  site_id         uuid references public.sites(id) on delete cascade,
  path            text not null,                       -- bucket path
  url             text not null,                       -- resolved public URL
  filename        text,
  mime_type       text,
  size_bytes      bigint,
  created_at      timestamptz not null default now(),
  unique (user_id, path)
);
create index if not exists site_assets_user_idx on public.site_assets (user_id, created_at desc);
create index if not exists site_assets_site_idx on public.site_assets (site_id, created_at desc);
alter table public.site_assets enable row level security;
drop policy if exists "site_assets_owner_all" on public.site_assets;
create policy "site_assets_owner_all"
  on public.site_assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
