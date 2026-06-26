-- Admin "Setup / Go-Live checklist" — every hole to close before (or while)
-- going live: env vars, supplier creds, migrations, test→active flips, pricing.
-- Admin-editable; seeded with the known items. seed_key keeps the seed
-- idempotent (admin-added rows have a null key).

create table if not exists public.setup_tasks (
  id          uuid primary key default gen_random_uuid(),
  seed_key    text unique,
  title       text not null,
  detail      text,
  category    text not null default 'general',
  -- env | credentials | migration | pricing | integration | config | go_live | general
  status      text not null default 'todo',
  -- todo | in_progress | done | skipped
  env_var     text,    -- if set, the page shows live "set / not set" detection
  link        text,    -- optional route or URL to where the task is done
  sort_order  int not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.setup_tasks enable row level security;
drop policy if exists "setup_tasks admin all" on public.setup_tasks;
create policy "setup_tasks admin all"
  on public.setup_tasks for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.setup_tasks (seed_key, title, detail, category, env_var, link, sort_order) values
  ('apply-migrations', 'Apply pending database migrations',
   'Apply any pending migrations (incl. the NIL Stores set 20260615730000–770000) via the Migrations dashboard.',
   'migration', null, '/dashboard/admin/migrations', 10),

  ('env-service-role', 'Set SUPABASE_SERVICE_ROLE_KEY',
   'Required for admin tools, the Stripe webhook, supplier sync, and email logging.',
   'env', 'SUPABASE_SERVICE_ROLE_KEY', null, 20),
  ('env-stripe-secret', 'Set STRIPE_SECRET_KEY',
   'Secret key for payments + Connect transfers.', 'env', 'STRIPE_SECRET_KEY', null, 21),
  ('env-stripe-webhook', 'Set STRIPE_WEBHOOK_SECRET',
   'Signs the Stripe webhook that fulfills brand kits, provisioning, and store orders.',
   'env', 'STRIPE_WEBHOOK_SECRET', null, 22),
  ('env-stripe-pub', 'Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
   'Client publishable key for embedded checkout.', 'env', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', null, 23),
  ('env-resend', 'Set RESEND_API_KEY',
   'Transactional email — fulfillment notices, welcome, outreach.', 'env', 'RESEND_API_KEY', null, 24),
  ('env-resend-from', 'Set RESEND_FROM_EMAIL',
   'From address for outbound mail (a verified domain sender).', 'env', 'RESEND_FROM_EMAIL', null, 25),

  ('env-gemini', 'Set GEMINI_API_KEY',
   'Logo generation for the brand designer.', 'integration', 'GEMINI_API_KEY', null, 40),
  ('env-ideogram', 'Set IDEOGRAM_API_KEY',
   'Alternate image generation (legacy logo / print-shop proofs).', 'integration', 'IDEOGRAM_API_KEY', null, 41),
  ('env-anthropic', 'Set ANTHROPIC_API_KEY',
   'Insights narratives + Personal Brand Toolkit coaching.', 'integration', 'ANTHROPIC_API_KEY', null, 42),
  ('env-heygen', 'Set HEYGEN_API_KEY',
   'Climb milestone video automation.', 'integration', 'HEYGEN_API_KEY', null, 43),
  ('env-phyllo', 'Set PHYLLO_CLIENT_ID + PHYLLO_CLIENT_SECRET',
   'Social stats (NILfluence). Set PHYLLO_ENVIRONMENT=production for live data.',
   'integration', 'PHYLLO_CLIENT_ID', null, 44),
  ('env-vectorizer', 'Set VECTORIZER_AI_API_ID + SECRET',
   'Logo vectorization (SVG) for brand kits and logo mod.', 'integration', 'VECTORIZER_AI_API_ID', null, 45),
  ('env-gdrive', 'Set GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON + PARENT_FOLDER_ID',
   'Mirrors brand kits + store mockups to Google Drive.', 'integration', 'GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON', null, 46),
  ('env-vercel', 'Set VERCEL_ACCESS_TOKEN + VERCEL_PROJECT_ID',
   'Custom domains for talent sites + EPKs via the Vercel API.', 'integration', 'VERCEL_ACCESS_TOKEN', null, 47),
  ('env-cron', 'Set CRON_SECRET',
   'Authorizes the Vercel cron that syncs supplier catalogs.', 'config', 'CRON_SECRET', null, 48),
  ('env-sharetribe', 'Set SHARETRIBE_* credentials',
   'NILiance marketplace bridge (Integration + Marketplace API keys).', 'integration', 'SHARETRIBE_CLIENT_ID', null, 49),

  ('supplier-ss-creds', 'Configure S&S Activewear credentials',
   'Account # + API token in Admin → Suppliers, then Test.', 'credentials', null, '/dashboard/admin/suppliers', 60),
  ('supplier-ps-creds', 'Configure PromoStandards credentials',
   'Username/password + Product Data / Inventory / PurchaseOrder WSDL URLs.', 'credentials', null, '/dashboard/admin/suppliers', 61),
  ('go-ss-autofulfill', 'Enable S&S auto-fulfill (SS_AUTO_FULFILL=true)',
   'TEST→ACTIVE. Validate first with SS_TEST_ORDERS=true (S&S test order, no charge).',
   'go_live', 'SS_AUTO_FULFILL', null, 62),
  ('go-ps-autofulfill', 'Enable PromoStandards auto-fulfill (PS_AUTO_FULFILL=true)',
   'TEST→ACTIVE. The first live order validates the SendPO schema; faults surface on the order.',
   'go_live', 'PS_AUTO_FULFILL', null, 63),
  ('catalog-approve', 'Approve supplier catalog products',
   'Newly synced products land pending — approve them in Suppliers → Catalog approval.',
   'config', null, '/dashboard/admin/suppliers/catalog', 64),

  ('pricing-review', 'Review all service prices',
   'Confirm Brand Design, concept pack (per 10), additional brand, revisions, and store commission.',
   'pricing', null, '/dashboard/admin/pricing', 70),

  ('go-stripe-live', 'Switch Stripe from test to live keys',
   'Replace test secret / publishable / webhook secret with live values to take real payments.',
   'go_live', null, null, 80),
  ('go-connect', 'Verify talent Stripe Connect onboarding',
   'Talents must finish Connect onboarding to receive store + site payouts.',
   'go_live', null, '/dashboard/admin/payouts', 81)
on conflict (seed_key) do nothing;
