-- Returns the shape of the public schema so the Migrations dashboard can
-- detect which migrations have ACTUALLY been applied by checking whether
-- the objects each migration creates exist — independent of
-- supabase_migrations.schema_migrations (which only the CLI maintains).
create or replace function public.db_objects()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'tables', (
      select coalesce(jsonb_agg(lower(c.relname)), '[]'::jsonb)
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
    ),
    'columns', (
      select coalesce(jsonb_agg(lower(col.table_name || '.' || col.column_name)), '[]'::jsonb)
      from information_schema.columns col
      where col.table_schema = 'public'
    ),
    'functions', (
      select coalesce(jsonb_agg(distinct lower(p.proname)), '[]'::jsonb)
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
    ),
    'policies', (
      select coalesce(jsonb_agg(lower(pol.tablename || '.' || pol.policyname)), '[]'::jsonb)
      from pg_catalog.pg_policies pol
      where pol.schemaname = 'public'
    ),
    'indexes', (
      select coalesce(jsonb_agg(lower(idx.indexname)), '[]'::jsonb)
      from pg_catalog.pg_indexes idx
      where idx.schemaname = 'public'
    )
  )
$$;

revoke all on function public.db_objects() from public, anon;
grant execute on function public.db_objects() to authenticated, service_role;
