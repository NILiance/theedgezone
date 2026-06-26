-- Rewards & Points engine.
-- reward_items / reward_redemptions / profiles.points already exist;
-- this adds the missing engine: an auditable ledger + atomic award/redeem
-- functions so balances can't drift or go negative.

create table if not exists public.point_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  delta       integer not null,            -- + earned, − spent
  reason      text not null,               -- signup_bonus | profile_complete | daily_login | purchase | redemption | admin_adjust
  dedupe_key  text,                         -- one-time awards: unique per (user, key)
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create unique index if not exists point_tx_dedupe_idx
  on public.point_transactions (user_id, dedupe_key) where dedupe_key is not null;
create index if not exists point_tx_user_idx
  on public.point_transactions (user_id, created_at desc);

alter table public.point_transactions enable row level security;
drop policy if exists "point_tx owner read" on public.point_transactions;
create policy "point_tx owner read"
  on public.point_transactions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "point_tx admin read" on public.point_transactions;
create policy "point_tx admin read"
  on public.point_transactions for select to authenticated using (public.is_admin());

-- Award points (server-side only). Idempotent when p_dedupe_key is supplied —
-- the unique index turns a repeat into a no-op. Returns the new balance.
create or replace function public.award_points(
  p_user uuid,
  p_amount integer,
  p_reason text,
  p_dedupe_key text default null,
  p_metadata jsonb default '{}'::jsonb
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_balance integer;
begin
  if p_amount is null or p_amount = 0 then
    select coalesce(points, 0) into v_balance from public.profiles where id = p_user;
    return coalesce(v_balance, 0);
  end if;
  begin
    insert into public.point_transactions (user_id, delta, reason, dedupe_key, metadata)
      values (p_user, p_amount, p_reason, p_dedupe_key, coalesce(p_metadata, '{}'::jsonb));
  exception when unique_violation then
    select coalesce(points, 0) into v_balance from public.profiles where id = p_user;
    return coalesce(v_balance, 0);  -- already awarded
  end;
  update public.profiles set points = coalesce(points, 0) + p_amount
    where id = p_user
    returning points into v_balance;
  return coalesce(v_balance, 0);
end $$;
revoke all on function public.award_points(uuid, integer, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.award_points(uuid, integer, text, text, jsonb) to service_role;

-- Redeem a reward for the CALLING user (auth.uid) — atomic, never negative.
create or replace function public.redeem_reward(p_item uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_item public.reward_items%rowtype;
  v_balance integer;
  v_redemption uuid;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'Not signed in'); end if;
  select * into v_item from public.reward_items where id = p_item;
  if not found or v_item.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'Reward unavailable');
  end if;
  if v_item.stock is not null and v_item.stock <= 0 then
    return jsonb_build_object('ok', false, 'error', 'Out of stock');
  end if;

  select coalesce(points, 0) into v_balance from public.profiles where id = v_user for update;
  if v_balance < v_item.points_cost then
    return jsonb_build_object('ok', false, 'error', 'Not enough points', 'balance', v_balance);
  end if;

  insert into public.reward_redemptions (user_id, reward_item_id, points_spent, status)
    values (v_user, p_item, v_item.points_cost, 'pending') returning id into v_redemption;
  update public.profiles set points = points - v_item.points_cost where id = v_user;
  if v_item.stock is not null then
    update public.reward_items set stock = stock - 1 where id = p_item;
  end if;
  insert into public.point_transactions (user_id, delta, reason, metadata)
    values (v_user, -v_item.points_cost, 'redemption',
            jsonb_build_object('reward_item_id', p_item, 'redemption_id', v_redemption));

  return jsonb_build_object('ok', true, 'redemption_id', v_redemption, 'balance', v_balance - v_item.points_cost);
end $$;
revoke all on function public.redeem_reward(uuid) from public, anon;
grant execute on function public.redeem_reward(uuid) to authenticated;
