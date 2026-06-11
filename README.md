# Edge Zone (Next.js + Supabase)

The next-generation Edge Zone platform — a proprietary, portable stack rebuilt from
the WordPress + Code Snippets implementation on a modern foundation:

- **Next.js 15** (App Router, React 19, Server Components)
- **Supabase** (Postgres + Auth + RLS + Storage)
- **Vercel** (hosting, Edge Middleware, Custom Domains API)
- **Tailwind CSS** + **TypeScript** + **Zod**
- **Resend** (transactional email), **Inngest** (background jobs), **Stripe** (payments)

The legacy WordPress system at `theedgezone.com` continues to run during the
parallel build. Cutover happens after all modules are ported and verified.

See [SCHEMA.md](./SCHEMA.md) for the full data model.

---

## Quick start

```powershell
# 1. Install dependencies
pnpm install

# 2. Copy env template and fill in Supabase keys
Copy-Item .env.example .env.local
# Edit .env.local — at minimum NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Link the local project to your remote Supabase project
pnpm supabase login
pnpm supabase link --project-ref <your-project-ref>

# 4. Push the Phase 0 migration
pnpm db:push

# 5. Generate TypeScript types from the schema
pnpm db:types

# 6. Run the dev server
pnpm dev
```

Visit http://localhost:3000.

---

## External services — setup checklist

### GitHub
- Repo: `NILiance/theedgezone`
- Free tier is fine for now.

### Supabase
1. Create project at https://supabase.com — region **US East (Virginia)**.
2. Save project URL, `anon` key, `service_role` key, DB password.
3. Settings → Authentication → enable Email/Password + (optional) Google OAuth.
4. Set Site URL to your production domain when ready.
5. Plan: Free for dev, **Pro ($25/mo)** for prod.

### Vercel
1. Sign up at https://vercel.com with GitHub.
2. Import the `NILiance/theedgezone` repo.
3. Add env vars from `.env.local`.
4. **Don't add custom domains yet** — wait until Phase 0.5 (custom domains feature live).
5. Plan: Hobby for dev, **Pro ($20/mo)** for prod.

### Resend
1. Sign up at https://resend.com.
2. Add your sending domain (e.g. `theedgezone.com`).
3. Add the DNS records Resend provides (SPF, DKIM, DMARC) at your registrar.
4. Create an API key; save as `RESEND_API_KEY`.
5. Plan: Free (3K/mo) — upgrade as needed.

### Stripe
- Use a **new restricted API key** for this project (do not reuse the WordPress key).
- Webhook endpoint: `https://<app-url>/api/webhooks/stripe` (added in Phase 1).
- Keep the WordPress webhook active in parallel during transition.

### Inngest (Phase 1)
- Sign up at https://inngest.com.
- Create app; save `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`.

### Pre-existing integrations (carry over from legacy)
- Ideogram, HeyGen, Google Drive service account, Sharetribe — env keys added when each module is ported.

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the built app |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier write |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:push` | Apply migrations to linked Supabase project |
| `pnpm db:diff` | Show schema diff vs linked project |
| `pnpm db:types` | Regenerate TypeScript types from schema |
| `pnpm db:reset` | Reset local Supabase DB (destructive) |

---

## Project layout

```
app/                       Next.js App Router routes
  layout.tsx              Root layout
  page.tsx                Landing
  (auth)/                 Auth pages — Phase 0.5
  (dashboard)/            Authenticated dashboard — Phase 0.5
  site/[slug]/            Talent site routes (subdomain rewrites here)
  epk/[slug]/             EPK routes
  podcast/[slug]/         Podcast routes
  api/                    Route handlers (webhooks, server actions)

lib/
  env.ts                  Zod-validated env vars
  supabase/
    server.ts             Supabase client for Server Components / Route Handlers
    client.ts             Supabase client for Client Components
    middleware.ts         Session refresh helper for middleware
    database.types.ts     Generated — do not edit

middleware.ts             Edge middleware: subdomain routing + auth refresh
supabase/
  config.toml             Supabase CLI config
  migrations/             SQL migrations
```

---

## Migration phases (see `SCHEMA.md` for full schema)

| # | Phase | Status |
|---|---|---|
| 0 | Foundation (identity, audit, custom domains, webhook log) | **In progress** |
| 1 | Marketplace + Fulfillment | Pending |
| 2 | BrandDesign + EPK | Pending |
| 3 | TalentSiteBuilder | Pending |
| 4 | NilStores + AppsForTalent | Pending |
| 5 | PodcastForTalent | Pending |
| 6 | Climb + Climb Admin | Pending |
| 7 | Niliance bridge | Pending |
| 8 | Data migration + DNS cutover | Pending |
