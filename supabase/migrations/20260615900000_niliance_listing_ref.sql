-- The talent's NILiance LISTING id + slug (distinct from their user uuid).
-- NILiance "View Full Profile" / brand "edit listing" URLs are built from the
-- listing slug+uuid (/l/{slug}/{uuid}), so we capture them during inbound sync.
alter table public.profiles
  add column if not exists niliance_listing_id text,
  add column if not exists niliance_listing_slug text;
