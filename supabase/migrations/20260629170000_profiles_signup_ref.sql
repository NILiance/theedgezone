-- Attribution: which product domain / landing drove each signup (the ?ref= on
-- the dedicated landing-page CTAs). Also stored in auth user metadata.
alter table public.profiles add column if not exists signup_ref text;
