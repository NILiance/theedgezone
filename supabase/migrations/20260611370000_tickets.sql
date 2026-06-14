-- ============================================================================
-- Support tickets
-- ============================================================================

create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  subject       text not null,
  body          text not null,
  category      text default 'general',
  -- general | billing | technical | brand-design | site-builder | epk | other
  priority      text not null default 'normal',
  -- low | normal | high | urgent
  status        text not null default 'open',
  -- open | pending | resolved | closed
  assigned_to   uuid references auth.users(id) on delete set null,
  last_activity_at timestamptz not null default now(),
  closed_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists tickets_user_idx on public.tickets (user_id, created_at desc);
create index if not exists tickets_status_idx on public.tickets (status, last_activity_at desc);

create table if not exists public.ticket_replies (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete set null,
  body        text not null,
  is_internal boolean not null default false,
  -- internal notes only show to admins, not to the talent
  created_at  timestamptz not null default now()
);
create index if not exists ticket_replies_ticket_idx on public.ticket_replies (ticket_id, created_at asc);

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table public.tickets enable row level security;
create policy "tickets_owner_read"
  on public.tickets for select using (auth.uid() = user_id);
create policy "tickets_owner_insert"
  on public.tickets for insert with check (auth.uid() = user_id);
create policy "tickets_owner_update"
  on public.tickets for update using (auth.uid() = user_id and status != 'closed');
create policy "tickets_admin_all"
  on public.tickets for all using (public.is_admin()) with check (public.is_admin());

alter table public.ticket_replies enable row level security;
-- Owner reads non-internal replies on their tickets.
create policy "ticket_replies_owner_read"
  on public.ticket_replies for select
  using (
    is_internal = false and
    exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );
-- Owner posts on their tickets.
create policy "ticket_replies_owner_insert"
  on public.ticket_replies for insert
  with check (
    is_internal = false and
    exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );
-- Admins can do anything.
create policy "ticket_replies_admin_all"
  on public.ticket_replies for all
  using (public.is_admin()) with check (public.is_admin());

-- Touch trigger
create or replace function public.touch_ticket()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists tickets_touch on public.tickets;
create trigger tickets_touch before update on public.tickets for each row execute function public.touch_ticket();

-- Bump tickets.last_activity_at on every reply.
create or replace function public.bump_ticket_activity()
returns trigger language plpgsql as $$
begin
  update public.tickets
    set last_activity_at = now(),
        status = case when status = 'closed' then 'open' else status end
  where id = new.ticket_id;
  return new;
end;
$$;
drop trigger if exists ticket_replies_bump on public.ticket_replies;
create trigger ticket_replies_bump after insert on public.ticket_replies
  for each row execute function public.bump_ticket_activity();
