-- Manual social follower counts + engagement rates per platform. Used by the
-- NILfluence score as a fallback when Phyllo isn't connected (Phyllo wins when
-- available). Shape, keyed by the four scoring platforms:
--   { "instagram": { "followers": 12000, "er": 3.5 }, "tiktok": {...},
--     "twitter": {...}, "youtube": {...} }
-- (er is an engagement-rate PERCENT, e.g. 3.5 means 3.5%.)
alter table public.profiles
  add column if not exists social_metrics jsonb not null default '{}'::jsonb;
