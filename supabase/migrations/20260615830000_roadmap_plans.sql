-- Roadmap Builder: a personalized plan produced by the intake wizard —
-- the talent's answers, their NIL readiness score/grade, and recommended
-- services. Shareable via a token (the public plan page reads it by token
-- through the service client, so no anon RLS is needed).

create table if not exists public.roadmap_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  share_token     text not null unique,
  intake          jsonb not null default '{}'::jsonb,
  score           int,
  grade           text,
  recommendations jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists roadmap_plans_user_idx
  on public.roadmap_plans (user_id, created_at desc);

alter table public.roadmap_plans enable row level security;
drop policy if exists "roadmap_plans owner all" on public.roadmap_plans;
create policy "roadmap_plans owner all"
  on public.roadmap_plans for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "roadmap_plans admin read" on public.roadmap_plans;
create policy "roadmap_plans admin read"
  on public.roadmap_plans for select to authenticated using (public.is_admin());
