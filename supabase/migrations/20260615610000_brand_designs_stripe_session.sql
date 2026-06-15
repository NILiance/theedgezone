-- Track which Stripe session provisioned each brand_design. Lets the
-- 'additional logo' webhook stay idempotent on retries.
alter table brand_designs
  add column if not exists stripe_session_id text;

create unique index if not exists brand_designs_stripe_session_uniq
  on brand_designs (stripe_session_id)
  where stripe_session_id is not null;
