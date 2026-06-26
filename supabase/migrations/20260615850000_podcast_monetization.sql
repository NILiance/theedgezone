-- Podcasts: monetization via a tokenized private feed. The talent sets a
-- monthly price + marks episodes premium; subscribers pay (Stripe) and get a
-- unique private feed URL that includes premium episodes. The public feed +
-- player exclude premium.

alter table public.podcasts
  add column if not exists subscription_enabled boolean not null default false,
  add column if not exists subscription_price_cents int;

alter table public.podcast_episodes
  add column if not exists premium boolean not null default false;

create table if not exists public.podcast_subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  podcast_id          uuid not null references public.podcasts(id) on delete cascade,
  subscriber_email    text not null,
  feed_token          text not null unique,
  stripe_subscription_id text,
  stripe_customer_id  text,
  status              text not null default 'active',   -- active | cancelled | past_due
  current_period_end  timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists podcast_subs_podcast_idx
  on public.podcast_subscriptions (podcast_id, created_at desc);

alter table public.podcast_subscriptions enable row level security;
-- The talent reads their own podcast's subscribers; inserts + token lookups
-- happen through the service client (checkout webhook + private feed route).
drop policy if exists "podcast_subs owner read" on public.podcast_subscriptions;
create policy "podcast_subs owner read"
  on public.podcast_subscriptions for select to authenticated using (
    exists (select 1 from public.podcasts p where p.id = podcast_id and p.user_id = auth.uid())
  );
