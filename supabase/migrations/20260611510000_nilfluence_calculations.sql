create table if not exists public.nilfluence_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  inputs jsonb not null,
  result jsonb not null,
  niliance_synced_at timestamptz,
  niliance_error text,
  created_at timestamptz not null default now()
);
create index if not exists nilfluence_calc_user_idx
  on public.nilfluence_calculations (user_id, created_at desc);

alter table public.nilfluence_calculations enable row level security;
create policy "nilfluence owner read"
  on public.nilfluence_calculations for select
  to authenticated using (user_id = auth.uid());
create policy "nilfluence owner insert"
  on public.nilfluence_calculations for insert
  to authenticated with check (user_id = auth.uid() or user_id is null);
create policy "nilfluence admin all"
  on public.nilfluence_calculations for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
