# Integrations Setup

Every third-party service Edge Zone talks to, with step-by-step setup. Add new env vars to **Vercel → Settings → Environment Variables** (Production + Preview + Development) and also to your local `.env.local` for dev. Save settings; pushes to `main` redeploy automatically.

The Admin Integrations page (`/dashboard/admin/integrations`) shows which env vars are set vs missing on the running deploy.

---

## Stripe — payments + payouts

What it powers: marketplace checkout, NIL store checkout, print shop checkout, logo-mod checkout, talent Connect payouts (15% platform fee).

1. Create a Stripe account at https://dashboard.stripe.com/register.
2. Switch to **Live mode** when you're ready to take real money. Keep **Test mode** for QA.
3. **Standard keys** → https://dashboard.stripe.com/apikeys
   - Copy "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Reveal & copy "Secret key" → `STRIPE_SECRET_KEY`
4. **Webhook** → https://dashboard.stripe.com/webhooks → "Add endpoint"
   - URL: `https://theedgezone.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `account.updated` (for Connect)
     - `payout.*` (paid, failed, in_transit, etc.)
   - Save. Click the endpoint → "Reveal signing secret" → `STRIPE_WEBHOOK_SECRET`.
5. **Connect (talent payouts)** → https://dashboard.stripe.com/settings/applications
   - Enable "Connect" if not already.
   - Choose **Express** as the account type.
   - Brand the OAuth screen.
   - Optionally a separate Connect webhook with `account.updated` + `payout.*` → `STRIPE_CONNECT_WEBHOOK_SECRET` (currently shares STRIPE_WEBHOOK_SECRET).

**Env**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Supabase — database + auth + storage

What it powers: every persisted thing — accounts, sessions, profiles, sites, EPKs, etc., plus the `site-assets` storage bucket and the `brand-assets` bucket.

1. https://supabase.com/dashboard → "New project".
2. Once provisioned, **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY` (this bypasses RLS — Vercel-only, never ship to client).
3. **Storage** → create two public buckets:
   - `site-assets` (public read; auth write)
   - `brand-assets` (public read; auth write)
4. Apply migrations: in this repo, `pnpm supabase link --project-ref <ref>` once, then `pnpm db:push` whenever migrations land.

**Env**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Resend — transactional email

What it powers: welcome emails, post-purchase emails, brand-design "designs ready" emails, EPK share links, weekly insights, bulk outreach.

1. https://resend.com → create account.
2. Add and verify your sending domain (`theedgezone.com` or subdomain like `mail.theedgezone.com`). Resend gives you DNS records to add at your domain registrar — verify before you can send to non-team addresses.
3. **API Keys** → "Create API Key" → name it `edge-zone` → copy → `RESEND_API_KEY`.
4. Pick a from-address on your verified domain → `RESEND_FROM_EMAIL`.

**Env**
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@theedgezone.com
```

---

## Anthropic — Claude (Generate buttons)

What it powers: brand voice doc generation, weekly insights writing, block "Improve with prompt" actions.

1. https://console.anthropic.com → Settings → API Keys → "Create Key" → `ANTHROPIC_API_KEY`.
2. Add billing: Settings → Plans & Billing → add a credit card and a small monthly limit ($25 is plenty to start).

**Env**
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Ideogram — logo + image generation

What it powers: Brand Design Studio logo concepts, AssetPicker "Generate from description" button.

1. https://ideogram.ai/manage-api → switch to API tab → buy credits ($20+ to start).
2. "Create API Key" → `IDEOGRAM_API_KEY`.

**Env**
```
IDEOGRAM_API_KEY=...
```

---

## Vectorizer.ai — true vector SVG (Brand Design P0 #1)

What it powers: `logo.svg` file in the brand-kit ZIP. Without it, we fall back to a raster-embedded SVG wrapper (still scalable, but not editable as a true vector).

1. https://vectorizer.ai/api → "Get started" → choose a plan or pay-as-you-go.
2. "Create API credentials" → copy both:
   - "API ID" → `VECTORIZER_AI_API_ID`
   - "API Secret" → `VECTORIZER_AI_API_SECRET`

**Env**
```
VECTORIZER_AI_API_ID=...
VECTORIZER_AI_API_SECRET=...
```

---

## HeyGen — Climb narrator videos

What it powers: auto-generated avatar videos for Climb milestones.

1. https://app.heygen.com → Settings → API → "Create API Key" → `HEYGEN_API_KEY`.
2. Pick a plan that includes API minutes (Creator+ at minimum).
3. Pick an avatar + voice you like and note the IDs (Avatars / Voices pages have copy buttons). Admin can paste them on each milestone editor.

**Env**
```
HEYGEN_API_KEY=...
```

---

## Phyllo — social account verification + auto-sync

What it powers: "Connect socials" card on the profile editor (IG/TikTok/YouTube/Twitter), "Pull from Phyllo" button on the NILfluence calculator that auto-populates followers + engagement.

1. https://dashboard.getphyllo.com → "Create app" (start in **Sandbox**; switch to Production once you've signed a contract).
2. App Settings → API credentials:
   - Client ID → `PHYLLO_CLIENT_ID`
   - Client Secret → `PHYLLO_CLIENT_SECRET`
   - Environment → `PHYLLO_ENV` (one of `sandbox`, `staging`, `production`)
3. Configure allowed redirect URLs to include `https://theedgezone.com`.

**Env**
```
PHYLLO_CLIENT_ID=...
PHYLLO_CLIENT_SECRET=...
PHYLLO_ENV=sandbox
```

---

## Google Drive — brand-kit ZIP storage

What it powers: a shareable link for each talent's brand-kit ZIP. Without it, kits are uploaded to the Supabase `site-assets` bucket instead — also works, just less polished sharing.

1. https://console.cloud.google.com → create a project.
2. Enable "Google Drive API" (APIs & Services → Library → search).
3. **IAM & Admin → Service Accounts → Create**:
   - Name `edge-zone-brand-kits`.
   - Grant role "Editor".
   - Open the new service account → Keys → "Add key → JSON" → downloads `<sa>.json`.
4. Open `<sa>.json`, copy the **entire JSON contents** as a single line, paste into `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`. (Yes, the whole JSON blob is the env value.)
5. In Google Drive, create a folder (e.g. "Edge Zone Brand Kits"), right-click → Share → add the service account's email (it's in the JSON: `client_email`) with **Editor** access.
6. The folder ID is the part of the URL after `/folders/` → `GOOGLE_DRIVE_PARENT_FOLDER_ID`.

**Env**
```
GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_DRIVE_PARENT_FOLDER_ID=1AbCDefGhIj...
```

---

## Vercel — hosting + custom domains + cron + Vercel-side things

What it powers: hosting the Next.js app, custom-domain provisioning for talent sites (`<slug>.mytalentsite.com`), cron triggers for nightly tasks.

1. Project is already deployed: https://vercel.com/dashboard.
2. **Domains** → add `theedgezone.com`, `mytalentsite.com`, `talentepk.com`, etc. Follow Vercel's DNS prompts.
3. **Custom-domain API** (for adding talent custom domains programmatically):
   - **Account Settings → Tokens** → "Create" → scope to your team → copy → `VERCEL_ACCESS_TOKEN`.
   - Project Settings → General → copy "Project ID" → `VERCEL_PROJECT_ID`.
   - Team Settings → "Team ID" → `VERCEL_TEAM_ID` (only required for teams; leave blank for personal).
4. **Cron secret**: Cron jobs in `vercel.json` are protected by a header. Generate a random secret (`openssl rand -base64 32`) and set `CRON_SECRET` — Vercel auto-passes this to scheduled jobs.

**Env**
```
VERCEL_ACCESS_TOKEN=...
VERCEL_PROJECT_ID=prj_...
VERCEL_TEAM_ID=team_...
CRON_SECRET=<random base64>
```

---

## NILiance / Sharetribe — marketplace bridge

What it powers: profile sync, brand opportunities, NIL deal flow. Sharetribe runs NILiance; we have two API clients.

1. Sign in to https://flex-console.sharetribe.com.
2. **Build → Applications**:
   - "Integration API" application → create → copy Client ID + Secret → `SHARETRIBE_CLIENT_ID` + `SHARETRIBE_CLIENT_SECRET`.
   - "Marketplace API" application with `trusted:` scope → create → `SHARETRIBE_MP_CLIENT_ID` + `SHARETRIBE_MP_CLIENT_SECRET`.
3. Note the marketplace URL → `NILIANCE_BASE_URL` (e.g., `https://niliance.com`).
4. For the NILfluence calculator's "Send to NILiance" feature, NILiance needs an inbound `POST /integrations/nilfluence` endpoint that accepts a JSON payload. The header `X-API-Key` carries the secret — set the same value as `NILIANCE_API_KEY` on both ends.

**Env**
```
SHARETRIBE_CLIENT_ID=...
SHARETRIBE_CLIENT_SECRET=...
SHARETRIBE_MP_CLIENT_ID=...
SHARETRIBE_MP_CLIENT_SECRET=...
NILIANCE_BASE_URL=https://niliance.com
NILIANCE_API_KEY=<shared secret>
```

---

## NIL Stores supplier integrations

Optional. Enable from `/dashboard/admin/suppliers`. Each has its own credential form.

### S&S Activewear

1. Apply for a wholesaler account: https://www.ssactivewear.com/landing-page/register.
2. Once approved, request API access via support → they hand you an account number + API token.
3. Paste both into the admin form. Mock supplier is enabled by default for dev — switch to S&S only after you've tested with a real token.

### PromoStandards

1. Each promo product supplier publishes their own WSDL endpoints. Contact your distributor and ask for:
   - Product Data WSDL URL
   - Inventory WSDL URL
   - Username + Password
2. Paste into the admin form.

### SanMar, OneSource

Currently scaffolded but not wired. Their creds go into the admin form; concrete API clients land in a future round.

---

## CRM (REST + AJAX fallback)

What it powers: post-purchase contact sync.

```
CRM_API_URL=https://your-crm.example.com/api
CRM_API_KEY=...
```

If unset, post-purchase sync is a no-op and the order still completes.

---

## Quick reference — env vars table

| Variable | Service | Required? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | ✅ for payments |
| `STRIPE_SECRET_KEY` | Stripe | ✅ for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe | ✅ for payments |
| `RESEND_API_KEY` | Resend | ✅ for emails |
| `RESEND_FROM_EMAIL` | Resend | ✅ for emails |
| `ANTHROPIC_API_KEY` | Claude | Optional |
| `IDEOGRAM_API_KEY` | Ideogram | Optional — needed for Brand Design |
| `VECTORIZER_AI_API_ID` | Vectorizer.ai | Optional — vector SVG in kit |
| `VECTORIZER_AI_API_SECRET` | Vectorizer.ai | Optional |
| `HEYGEN_API_KEY` | HeyGen | Optional — Climb videos |
| `PHYLLO_CLIENT_ID` | Phyllo | Optional |
| `PHYLLO_CLIENT_SECRET` | Phyllo | Optional |
| `PHYLLO_ENV` | Phyllo | Optional |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` | Google Drive | Optional |
| `GOOGLE_DRIVE_PARENT_FOLDER_ID` | Google Drive | Optional |
| `VERCEL_ACCESS_TOKEN` | Vercel | Optional — custom domains |
| `VERCEL_PROJECT_ID` | Vercel | Optional |
| `VERCEL_TEAM_ID` | Vercel | Optional |
| `CRON_SECRET` | Vercel cron | ✅ if cron is on |
| `SHARETRIBE_CLIENT_ID` | NILiance | Optional |
| `SHARETRIBE_CLIENT_SECRET` | NILiance | Optional |
| `SHARETRIBE_MP_CLIENT_ID` | NILiance | Optional |
| `SHARETRIBE_MP_CLIENT_SECRET` | NILiance | Optional |
| `NILIANCE_BASE_URL` | NILiance | Optional |
| `NILIANCE_API_KEY` | NILiance | Optional |
| `CRM_API_URL` | CRM | Optional |
| `CRM_API_KEY` | CRM | Optional |
| `NEXT_PUBLIC_SITE_URL` | Self-reference | Recommended |

---

## After saving env vars

Vercel redeploys automatically on the next `git push`. To force a redeploy without a new commit: Vercel dashboard → Deployments → click the latest → "Redeploy".
