-- Exposes the list of applied migration versions to the admin
-- Migrations dashboard.
--
-- Supabase tracks applied migrations in supabase_migrations.schema_migrations,
-- but that schema is NOT exposed through PostgREST (only public + graphql_public
-- are). So we wrap it in a SECURITY DEFINER function in the public schema that
-- the service-role client can call via rpc(). The function only returns the
-- version strings (timestamp prefixes) — nothing sensitive.
create or replace function public.list_applied_migrations()
returns table (version text)
language sql
security definer
set search_path = ''
as $$
  select version::text
  from supabase_migrations.schema_migrations
  order by version
$$;

revoke all on function public.list_applied_migrations() from public, anon;
grant execute on function public.list_applied_migrations() to authenticated, service_role;
