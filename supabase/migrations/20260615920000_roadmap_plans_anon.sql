-- Allow anonymous (logged-out) roadmap plans from the public Free Roadmap quiz.
-- The plan is created via the service client and read back by share_token, so
-- there is no authenticated user to attach. The existing owner/admin RLS
-- policies are unchanged — they only ever match rows that DO have a user_id.
alter table public.roadmap_plans alter column user_id drop not null;
