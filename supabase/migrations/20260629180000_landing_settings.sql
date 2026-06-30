-- Branding for the product landing pages (/lp/[product] served at each product
-- domain root). Singleton row. Public-readable so the anon-rendered pages can
-- pull it; admin-writable.
create table if not exists public.landing_settings (
  id integer primary key default 1 check (id = 1),
  accent_color text,         -- overrides the per-product accent hue when set
  logo_url text,             -- header logo (brand-design logo or custom upload)
  footer_text text default 'Brought to you by The Edge Zone',
  show_logo boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.landing_settings (id) values (1) on conflict (id) do nothing;

alter table public.landing_settings enable row level security;
create policy "landing_settings public read"
  on public.landing_settings for select to anon, authenticated using (true);
create policy "landing_settings admin write"
  on public.landing_settings for all to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
