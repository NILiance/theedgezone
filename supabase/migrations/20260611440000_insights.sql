create table if not exists public.weekly_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  headline text not null,
  bullets jsonb not null default '[]'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  emailed_at timestamptz,
  unique (user_id, period_start)
);
alter table public.weekly_insights enable row level security;
create policy "weekly_insights owner read"
  on public.weekly_insights for select
  to authenticated using (user_id = auth.uid());
create policy "weekly_insights admin all"
  on public.weekly_insights for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
