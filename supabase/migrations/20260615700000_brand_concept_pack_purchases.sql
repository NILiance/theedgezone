-- Records each purchased concept pack so we can bump
-- brand_designs.paid_concepts_total exactly once per Stripe session.
-- The unique stripe_session_id is the idempotency key: whichever of the
-- sync fulfillment (success redirect) or the async webhook inserts first
-- wins and applies the bump; the other hits the unique violation and
-- skips it.
create table if not exists public.brand_concept_pack_purchases (
  id uuid primary key default gen_random_uuid(),
  brand_design_id uuid not null references public.brand_designs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_session_id text not null unique,
  pack_size integer not null default 10,
  amount_cents integer,
  created_at timestamptz not null default now()
);

create index if not exists brand_concept_pack_purchases_brand_idx
  on public.brand_concept_pack_purchases (brand_design_id, created_at desc);

alter table public.brand_concept_pack_purchases enable row level security;

-- Talent can read their own purchase history; all writes go through the
-- service-role client in the webhook / fulfillment path.
create policy "concept_pack_purchases owner read"
  on public.brand_concept_pack_purchases for select
  to authenticated
  using (auth.uid() = user_id);
