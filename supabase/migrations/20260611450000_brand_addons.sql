create table if not exists public.brand_design_addons (
  id uuid primary key default gen_random_uuid(),
  brand_design_id uuid not null references public.brand_designs(id) on delete cascade,
  kind text not null check (kind in ('logo_animation', 'brand_voice_doc', 'qr_code', 'email_signature', 'social_avatars', 'trading_card')),
  url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (brand_design_id, kind)
);
alter table public.brand_design_addons enable row level security;
create policy "brand_design_addons owner read"
  on public.brand_design_addons for select
  to authenticated using (
    exists (
      select 1 from public.brand_designs bd
      where bd.id = brand_design_addons.brand_design_id and bd.user_id = auth.uid()
    )
  );
create policy "brand_design_addons admin all"
  on public.brand_design_addons for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
