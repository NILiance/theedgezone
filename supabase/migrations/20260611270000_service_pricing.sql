-- ============================================================================
-- Service pricing — DB-editable admin layer over the catalog
-- ============================================================================
-- One row per catalog service. The catalog itself stays in code (53 entries
-- in lib/services-data.ts) since it's mostly static content; this table is
-- just the price layer so admins can adjust without a deploy.

create table if not exists public.service_pricing (
  service_slug      text primary key,
  plan_monthly_cents int,                                -- null → no monthly plan
  plan_annual_cents  int,                                -- null → no annual plan
  plan_onetime_cents int,                                -- null → no one-time plan
  custom_label      text,                                -- e.g. "Free / Custom" override
  active            boolean not null default true,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id) on delete set null
);

alter table public.service_pricing enable row level security;
create policy "service_pricing_public_read"
  on public.service_pricing for select using (true);
create policy "service_pricing_admin_modify"
  on public.service_pricing for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.touch_service_pricing()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;
drop trigger if exists service_pricing_touch on public.service_pricing;
create trigger service_pricing_touch
  before insert or update on public.service_pricing
  for each row execute function public.touch_service_pricing();
