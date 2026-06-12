-- ============================================================================
-- Phase 9b v2-D — Fan + revenue block data tables
-- ============================================================================
-- Per-site catalogs for merch products, membership tiers, support rewards.
-- Fan-side submissions (tips, poll votes, guestbook entries) land in
-- public.site_submissions (already exists) with a `kind` discriminator
-- in payload.

-- ── Products (merch block) ─────────────────────────────────────────────────
create table if not exists public.site_products (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  name            text not null,
  description     text,
  price_cents     int not null default 0,
  currency        text not null default 'usd',
  image_url       text,
  stripe_price_id text,
  position        int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists site_products_site_idx on public.site_products (site_id, position);
alter table public.site_products enable row level security;
create policy "site_products_public_read"
  on public.site_products for select
  using (
    exists (select 1 from public.sites s
            where s.id = site_id and (s.status = 'published' or s.user_id = auth.uid() or public.is_admin()))
  );
create policy "site_products_owner_modify"
  on public.site_products for all
  using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()));

-- ── Membership tiers ──────────────────────────────────────────────────────
create table if not exists public.site_membership_tiers (
  id                 uuid primary key default gen_random_uuid(),
  site_id            uuid not null references public.sites(id) on delete cascade,
  name               text not null,
  price_cents        int not null default 0,
  billing_interval   text not null default 'month',   -- month | year
  description        text,
  perks              jsonb not null default '[]'::jsonb,
  stripe_price_id    text,
  position           int not null default 0,
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);
create index if not exists site_tiers_site_idx on public.site_membership_tiers (site_id, position);
alter table public.site_membership_tiers enable row level security;
create policy "site_tiers_public_read"
  on public.site_membership_tiers for select
  using (
    exists (select 1 from public.sites s
            where s.id = site_id and (s.status = 'published' or s.user_id = auth.uid() or public.is_admin()))
  );
create policy "site_tiers_owner_modify"
  on public.site_membership_tiers for all
  using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()));

-- ── Support rewards ───────────────────────────────────────────────────────
-- Rewards-showcase + milestone-rewards both pull from this table.
create table if not exists public.site_support_rewards (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  name            text not null,
  reward_type     text not null default 'digital',    -- digital | physical | experience | shoutout | wallpaper | trading_card | sticker | …
  description     text,
  file_url        text,
  unlock_amount_cents int not null default 0,         -- required tip / tier to unlock
  required_tier_id uuid references public.site_membership_tiers(id) on delete set null,
  image_url       text,
  position        int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists site_rewards_site_idx on public.site_support_rewards (site_id, position);
alter table public.site_support_rewards enable row level security;
create policy "site_rewards_public_read"
  on public.site_support_rewards for select
  using (
    exists (select 1 from public.sites s
            where s.id = site_id and (s.status = 'published' or s.user_id = auth.uid() or public.is_admin()))
  );
create policy "site_rewards_owner_modify"
  on public.site_support_rewards for all
  using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()));

-- ── Guestbook entries ─────────────────────────────────────────────────────
-- Separate from site_submissions so a public read policy is straightforward.
create table if not exists public.site_guestbook_entries (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  block_id        uuid references public.site_blocks(id) on delete set null,
  display_name    text not null,
  message         text not null,
  approved        boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists site_guestbook_site_idx on public.site_guestbook_entries (site_id, created_at desc);
alter table public.site_guestbook_entries enable row level security;
create policy "site_guestbook_public_read"
  on public.site_guestbook_entries for select
  using (
    approved = true and
    exists (select 1 from public.sites s
            where s.id = site_id and (s.status = 'published' or s.user_id = auth.uid() or public.is_admin()))
  );
create policy "site_guestbook_public_insert"
  on public.site_guestbook_entries for insert
  with check (true);
create policy "site_guestbook_owner_moderate"
  on public.site_guestbook_entries for update
  using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()));
create policy "site_guestbook_owner_delete"
  on public.site_guestbook_entries for delete
  using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()));

-- ── Poll votes ────────────────────────────────────────────────────────────
create table if not exists public.site_poll_votes (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  block_id        uuid not null references public.site_blocks(id) on delete cascade,
  option_value    text not null,
  voter_token     text,                  -- anonymous browser token (de-dupe per browser)
  voter_user_id   uuid,                  -- if logged-in supporter
  created_at      timestamptz not null default now()
);
create index if not exists site_polls_block_idx on public.site_poll_votes (block_id);
create unique index if not exists site_polls_dedupe_idx on public.site_poll_votes (block_id, voter_token)
  where voter_token is not null;
alter table public.site_poll_votes enable row level security;
create policy "site_polls_public_read"
  on public.site_poll_votes for select
  using (true);
create policy "site_polls_public_insert"
  on public.site_poll_votes for insert
  with check (true);

-- ── Tips ──────────────────────────────────────────────────────────────────
-- Records non-checkout tip-jar starts; once Stripe is wired these get
-- promoted to public.orders on payment-success webhook.
create table if not exists public.site_tips (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  block_id        uuid references public.site_blocks(id) on delete set null,
  display_name    text,
  amount_cents    int not null,
  message         text,
  status          text not null default 'pending',  -- pending | paid | failed
  stripe_session_id text,
  stripe_payment_intent text,
  created_at      timestamptz not null default now()
);
create index if not exists site_tips_site_idx on public.site_tips (site_id, created_at desc);
alter table public.site_tips enable row level security;
create policy "site_tips_owner_read"
  on public.site_tips for select
  using (
    exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid())
  );
create policy "site_tips_public_insert"
  on public.site_tips for insert
  with check (true);
create policy "site_tips_public_paid_read"
  on public.site_tips for select
  using (
    status = 'paid' and
    exists (select 1 from public.sites s where s.id = site_id and s.status = 'published')
  );
