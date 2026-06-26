-- Admin reconciliation helpers for the Migrations dashboard.
-- Because migrations get applied through the Supabase SQL editor (not the
-- CLI), supabase_migrations.schema_migrations isn't auto-updated. These
-- let the dashboard record / un-record a version so its applied/pending
-- status reflects reality with one click.

-- record_migration: insert the version. Handles the case where this
-- instance's schema_migrations.statements column is NOT NULL by retrying
-- with an empty array. Idempotent via on conflict do nothing.
create or replace function public.record_migration(p_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into supabase_migrations.schema_migrations (version)
  values (p_version)
  on conflict do nothing;
exception
  when not_null_violation then
    insert into supabase_migrations.schema_migrations (version, statements)
    values (p_version, array[]::text[])
    on conflict do nothing;
end;
$$;

-- unrecord_migration: remove the version (mark pending again).
create or replace function public.unrecord_migration(p_version text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from supabase_migrations.schema_migrations where version = p_version;
$$;

revoke all on function public.record_migration(text) from public, anon;
revoke all on function public.unrecord_migration(text) from public, anon;
grant execute on function public.record_migration(text) to service_role;
grant execute on function public.unrecord_migration(text) to service_role;
