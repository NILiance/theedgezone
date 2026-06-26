-- NIL Stores parity, phase 5: admin catalog approval gate.
-- Admin curates which synced supplier products talents may sell.
--
-- Idempotent backfill trick: add the column defaulting TRUE so existing
-- synced rows stay visible, then flip the default to FALSE so every NEW
-- sync lands unapproved and must be approved by an admin. Re-running is safe
-- (add-if-not-exists is a no-op; it never re-touches existing rows, so admin
-- approve/unapprove decisions are preserved).

alter table public.supplier_products
  add column if not exists approved boolean not null default true;
alter table public.supplier_products
  alter column approved set default false;

create index if not exists supplier_products_approved_idx
  on public.supplier_products (approved, active);

-- Talents only see approved + active products. Defense-in-depth: the talent
-- catalog browser reads via the service client, so it ALSO filters approved
-- explicitly — this policy guards any auth-client read (e.g. import).
drop policy if exists "supplier_products authed read" on public.supplier_products;
create policy "supplier_products authed read"
  on public.supplier_products for select
  to authenticated using (active = true and approved = true);
