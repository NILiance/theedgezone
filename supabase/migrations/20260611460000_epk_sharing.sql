create table if not exists public.epk_share_links (
  id uuid primary key default gen_random_uuid(),
  epk_id uuid not null references public.epks(id) on delete cascade,
  token text not null unique,
  label text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  recipient_email text,
  expires_at timestamptz,
  revoked_at timestamptz,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists epk_share_links_epk_idx on public.epk_share_links (epk_id);
create index if not exists epk_share_links_token_idx on public.epk_share_links (token);

alter table public.epk_share_links enable row level security;
create policy "epk_share_links owner read"
  on public.epk_share_links for select
  to authenticated using (created_by = auth.uid());
create policy "epk_share_links owner write"
  on public.epk_share_links for all
  to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "epk_share_links admin all"
  on public.epk_share_links for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create table if not exists public.epk_share_views (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.epk_share_links(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  user_agent text,
  ip_hash text,
  referrer text
);
create index if not exists epk_share_views_link_idx on public.epk_share_views (share_link_id);
alter table public.epk_share_views enable row level security;
create policy "epk_share_views owner read"
  on public.epk_share_views for select
  to authenticated using (
    exists (
      select 1 from public.epk_share_links s
      where s.id = epk_share_views.share_link_id and s.created_by = auth.uid()
    )
  );
create policy "epk_share_views admin all"
  on public.epk_share_views for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
