-- Print Shop fulfillment: configurable auto-handoff of paid orders to a print
-- partner (email) and/or a webhook/API endpoint, with an auto-vs-approve toggle.

-- Singleton settings row (id is forced to 1).
create table if not exists public.print_fulfillment_settings (
  id integer primary key default 1 check (id = 1),
  -- Trigger: true = dispatch the moment Stripe confirms payment; false = hold in
  -- a "ready" queue for an admin to approve + send.
  auto_send boolean not null default false,
  -- Channels (email is the default; webhook is opt-in).
  email_enabled boolean not null default true,
  webhook_enabled boolean not null default false,
  partner_email text,
  webhook_url text,
  webhook_auth_header text,
  updated_at timestamptz not null default now()
);
insert into public.print_fulfillment_settings (id) values (1) on conflict (id) do nothing;

alter table public.print_fulfillment_settings enable row level security;
create policy "print_fulfillment_settings admin all"
  on public.print_fulfillment_settings for all
  to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Per-order fulfillment handoff state.
--   pending — paid, not yet queued/sent
--   ready   — awaiting admin approval (manual mode)
--   sent    — handed off to email/webhook
--   failed  — handoff attempted but no channel succeeded
alter table public.print_orders
  add column if not exists fulfillment_status text not null default 'pending'
    check (fulfillment_status in ('pending', 'ready', 'sent', 'failed')),
  add column if not exists fulfillment_channel text,
  add column if not exists fulfillment_sent_at timestamptz,
  add column if not exists fulfillment_error text,
  add column if not exists fulfillment_ref text;
