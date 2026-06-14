-- ============================================================================
-- Stripe Connect — talent payouts
-- ============================================================================
-- Athletes onboard via Stripe Connect Express. After onboarding, the
-- platform receives site_transactions payments and automatically routes
-- (1 - PLATFORM_FEE_BPS / 10000) of each charge to the athlete's Connect
-- account. The 'application_fee_amount' on the PaymentIntent is the
-- platform's cut.
--
-- We mirror Stripe's account state on profiles so the UI can render
-- the right CTA without hitting Stripe live every page.

alter table public.profiles
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_connect_status text,
  -- one of: null | 'pending' | 'restricted' | 'active' | 'disabled'
  add column if not exists stripe_connect_charges_enabled boolean default false,
  add column if not exists stripe_connect_payouts_enabled boolean default false,
  add column if not exists stripe_connect_details_submitted boolean default false,
  add column if not exists stripe_connect_onboarded_at timestamptz;

create index if not exists profiles_stripe_connect_account_idx
  on public.profiles (stripe_connect_account_id)
  where stripe_connect_account_id is not null;

-- ── Payouts log (mirror of Stripe payout objects) ──────────────────────────
create table if not exists public.talent_payouts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  stripe_payout_id  text unique,
  stripe_account_id text not null,
  amount_cents      bigint not null,
  currency          text not null default 'usd',
  status            text not null default 'pending',
  -- one of: pending | in_transit | paid | failed | cancelled
  arrival_date      timestamptz,
  failure_message   text,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists talent_payouts_user_idx
  on public.talent_payouts (user_id, created_at desc);
create index if not exists talent_payouts_status_idx
  on public.talent_payouts (status, created_at desc);

alter table public.talent_payouts enable row level security;
create policy "talent_payouts_owner_read"
  on public.talent_payouts for select
  using (auth.uid() = user_id);
create policy "talent_payouts_admin_read"
  on public.talent_payouts for select
  using (public.is_admin());
-- writes happen via service role from the Stripe webhook only — no policy needed
