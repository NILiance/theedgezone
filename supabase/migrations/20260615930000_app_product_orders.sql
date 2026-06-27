-- In-app Shop orders. A fan buys a product from a talent's live app (/a/[id]);
-- payment is a Stripe destination charge to the talent's connected account
-- (same rails as site/store revenue). Created pending by /api/app-checkout,
-- promoted to paid by the Stripe webhook.

create table if not exists public.app_product_orders (
  id                uuid primary key default gen_random_uuid(),
  app_id            uuid not null references public.talent_apps(id) on delete cascade,
  product_id        text not null,
  product_name      text,
  quantity          int not null default 1,
  amount_cents      int not null,
  buyer_email       text,
  buyer_name        text,
  shipping          jsonb,
  stripe_session_id text unique,
  status            text not null default 'pending', -- pending | paid | refunded
  created_at        timestamptz not null default now()
);
create index if not exists app_product_orders_app_idx
  on public.app_product_orders (app_id, created_at desc);

alter table public.app_product_orders enable row level security;

-- The app owner can read their own app's orders. Inserts/updates happen via the
-- service role (checkout route + webhook), which bypasses RLS.
drop policy if exists "app_orders owner read" on public.app_product_orders;
create policy "app_orders owner read"
  on public.app_product_orders for select to authenticated
  using (
    exists (
      select 1 from public.talent_apps a
      where a.id = app_product_orders.app_id and a.user_id = auth.uid()
    )
  );
