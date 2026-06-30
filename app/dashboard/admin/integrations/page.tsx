import { requireAdmin } from '@/lib/auth'
import { IntegrationsAdmin } from './client'

export const metadata = { title: 'Integrations' }

export type EnvKey = { label: string; env: string; secret?: boolean; required?: boolean }
export type SetupStep = string
export type IntegrationGroup = {
  name: string
  module: string
  summary: string
  consoleUrl?: string
  docsUrl?: string
  steps: SetupStep[]
  keys: EnvKey[]
}

const GROUPS: IntegrationGroup[] = [
  {
    name: 'Stripe',
    module: 'Payments + payouts',
    summary:
      'Marketplace checkout, NIL store checkout, print shop, logo-mod, talent Connect payouts (15% platform fee).',
    consoleUrl: 'https://dashboard.stripe.com/',
    docsUrl: 'https://stripe.com/docs',
    steps: [
      'Create or sign in at https://dashboard.stripe.com.',
      'Switch to Live mode when you’re ready to take real money. Keep Test mode for QA.',
      'Standard keys → https://dashboard.stripe.com/apikeys. Copy Publishable + Secret.',
      'Webhook → https://dashboard.stripe.com/webhooks → Add endpoint at https://theedgezone.com/api/webhooks/stripe. Listen for checkout.session.completed, payment_intent.succeeded, account.updated, payout.*. Reveal & copy the signing secret.',
      'Connect → enable in https://dashboard.stripe.com/settings/applications. Choose Express. Brand the OAuth screen.',
    ],
    keys: [
      { label: 'Publishable key', env: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: true },
      { label: 'Secret key', env: 'STRIPE_SECRET_KEY', secret: true, required: true },
      { label: 'Webhook secret', env: 'STRIPE_WEBHOOK_SECRET', secret: true, required: true },
      { label: 'Connect webhook secret (optional)', env: 'STRIPE_CONNECT_WEBHOOK_SECRET', secret: true },
    ],
  },
  {
    name: 'Supabase',
    module: 'Database + Auth + Storage',
    summary: 'Every persisted thing — accounts, sessions, profiles, sites, EPKs, plus storage buckets.',
    consoleUrl: 'https://supabase.com/dashboard',
    docsUrl: 'https://supabase.com/docs',
    steps: [
      'https://supabase.com/dashboard → New project.',
      'Project Settings → API: copy URL, anon key, and service_role secret key.',
      'Storage → create two public buckets: site-assets and brand-assets.',
      'Run migrations from this repo: pnpm supabase link --project-ref <ref>, then pnpm db:push.',
    ],
    keys: [
      { label: 'URL', env: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
      { label: 'Anon key', env: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
      { label: 'Service role key', env: 'SUPABASE_SERVICE_ROLE_KEY', secret: true, required: true },
    ],
  },
  {
    name: 'Resend',
    module: 'Transactional email',
    summary:
      'Welcome emails, post-purchase, brand-design “designs ready”, EPK share links, weekly insights, bulk outreach.',
    consoleUrl: 'https://resend.com/',
    docsUrl: 'https://resend.com/docs',
    steps: [
      'Create a Resend account.',
      'Add + verify your sending domain (theedgezone.com or a subdomain). Add the DNS records Resend gives you at your registrar.',
      'API Keys → Create API Key → name it edge-zone → copy.',
      'Pick a from-address on your verified domain.',
    ],
    keys: [
      { label: 'API key', env: 'RESEND_API_KEY', secret: true, required: true },
      { label: 'From email', env: 'RESEND_FROM_EMAIL', required: true },
    ],
  },
  {
    name: 'Anthropic (Claude)',
    module: 'Generate actions',
    summary: 'Brand voice doc, weekly insights, block "Improve with prompt".',
    consoleUrl: 'https://console.anthropic.com/',
    docsUrl: 'https://docs.anthropic.com/',
    steps: [
      'console.anthropic.com → Settings → API Keys → Create Key.',
      'Settings → Plans & Billing → add a credit card. $25/mo cap is plenty to start.',
    ],
    keys: [{ label: 'API key', env: 'ANTHROPIC_API_KEY', secret: true }],
  },
  {
    name: 'Google Gemini',
    module: 'Brand Design Studio + Arsenal generators',
    summary:
      'Logo concepts (R1 + R2 refinement) and every Brand Arsenal image generator. One key powers them all.',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/image-generation',
    steps: [
      'Sign in at aistudio.google.com (free Google account).',
      'Click "Get API key" → "Create API key" → copy.',
      'Model used: gemini-2.5-flash-image. No project/billing setup needed for the free tier (rate-limited).',
      'For production volume, attach a billing account in Google Cloud Console.',
    ],
    keys: [{ label: 'API key', env: 'GEMINI_API_KEY', secret: true, required: true }],
  },
  {
    name: 'Ideogram (legacy)',
    module: 'Deprecated — replaced by Gemini',
    summary:
      'Previously powered Round 1 + Round 2 logo concepts. Replaced by Gemini for parity with the legacy WP plugin. Safe to leave blank.',
    consoleUrl: 'https://ideogram.ai/manage-api',
    docsUrl: 'https://developer.ideogram.ai/',
    steps: [
      'No setup needed — the Brand Designer no longer calls Ideogram.',
      'You can delete IDEOGRAM_API_KEY from Vercel once Gemini is configured.',
    ],
    keys: [{ label: 'API key (unused)', env: 'IDEOGRAM_API_KEY', secret: true }],
  },
  {
    name: 'Vectorizer.ai',
    module: 'True vector SVG (Brand kit)',
    summary:
      'Without it, logo.svg in the brand kit falls back to a raster-embedded SVG wrapper. With it, you get a true editable vector.',
    consoleUrl: 'https://vectorizer.ai/api',
    docsUrl: 'https://vectorizer.ai/api',
    steps: [
      'vectorizer.ai/api → Get started → pick a plan or pay-as-you-go.',
      'Create API credentials → copy API ID and API Secret.',
    ],
    keys: [
      { label: 'API ID', env: 'VECTORIZER_AI_API_ID' },
      { label: 'API Secret', env: 'VECTORIZER_AI_API_SECRET', secret: true },
    ],
  },
  {
    name: 'HeyGen',
    module: 'Climb narrator videos',
    summary: 'Auto-generated AI avatar videos for Climb milestones.',
    consoleUrl: 'https://app.heygen.com/settings/api',
    docsUrl: 'https://docs.heygen.com/',
    steps: [
      'app.heygen.com → Settings → API → Create API Key.',
      'Pick a plan that includes API minutes (Creator+ minimum).',
      'Pick an avatar + voice you like; note the IDs. Admin can paste them on each milestone.',
    ],
    keys: [{ label: 'API key', env: 'HEYGEN_API_KEY', secret: true }],
  },
  {
    name: 'Phyllo',
    module: 'Social verification + auto-sync',
    summary:
      'Connect socials on the profile editor + "Pull from Phyllo" button on the NILfluence calculator.',
    consoleUrl: 'https://dashboard.getphyllo.com/',
    docsUrl: 'https://docs.getphyllo.com/',
    steps: [
      'dashboard.getphyllo.com → Create app. Start in Sandbox.',
      'App Settings → API credentials → copy Client ID + Secret.',
      'Configure allowed redirect URLs to include https://theedgezone.com.',
    ],
    keys: [
      { label: 'Client ID', env: 'PHYLLO_CLIENT_ID' },
      { label: 'Client secret', env: 'PHYLLO_CLIENT_SECRET', secret: true },
      { label: 'Environment', env: 'PHYLLO_ENVIRONMENT' },
    ],
  },
  {
    name: 'Google Drive',
    module: 'Brand kit ZIP storage',
    summary:
      'Optional. Kits fall back to Supabase storage bucket if not configured — Drive is just for nicer sharing.',
    consoleUrl: 'https://console.cloud.google.com/',
    docsUrl: 'https://developers.google.com/drive',
    steps: [
      'console.cloud.google.com → create a project.',
      'APIs & Services → Library → enable Google Drive API.',
      'IAM & Admin → Service Accounts → Create. Grant Editor role. Add JSON key → downloads <sa>.json.',
      'Paste the entire JSON contents as a single string into GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON.',
      'In Google Drive, create a folder, right-click → Share → add the service account email (in the JSON as client_email) with Editor access. Copy the folder ID from the URL.',
    ],
    keys: [
      { label: 'Service account JSON', env: 'GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON', secret: true },
      { label: 'Parent folder ID', env: 'GOOGLE_DRIVE_PARENT_FOLDER_ID' },
    ],
  },
  {
    name: 'Vercel',
    module: 'Custom domains + cron',
    summary:
      'Custom talent subdomains (e.g. firstnamelast.mytalentsite.com) and cron secrets for scheduled jobs.',
    consoleUrl: 'https://vercel.com/dashboard',
    docsUrl: 'https://vercel.com/docs',
    steps: [
      'Account Settings → Tokens → Create. Scope to your team.',
      'Project Settings → General → copy Project ID.',
      'Team Settings → Team ID (only for teams; blank for personal).',
      'Generate a random CRON_SECRET (`openssl rand -base64 32`).',
    ],
    keys: [
      { label: 'Access token', env: 'VERCEL_ACCESS_TOKEN', secret: true },
      { label: 'Project ID', env: 'VERCEL_PROJECT_ID' },
      { label: 'Team ID', env: 'VERCEL_TEAM_ID' },
      { label: 'Cron secret', env: 'CRON_SECRET', secret: true },
    ],
  },
  {
    name: 'NILiance / Sharetribe',
    module: 'Marketplace bridge',
    summary: 'NIL deal flow + brand opportunities + NILfluence push.',
    consoleUrl: 'https://flex-console.sharetribe.com/',
    docsUrl: 'https://www.sharetribe.com/docs/',
    steps: [
      'flex-console.sharetribe.com → Build → Applications.',
      'Create "Integration API" application → copy Client ID + Secret.',
      'Create "Marketplace API" application with trusted: scope → copy ID + Secret.',
      'Note the marketplace URL for NILIANCE_BASE_URL.',
      'For the NILfluence "Send to NILiance" feature, agree on NILIANCE_API_KEY with the NILiance team and have them expose POST /integrations/nilfluence.',
    ],
    keys: [
      { label: 'Integration client ID', env: 'SHARETRIBE_CLIENT_ID' },
      { label: 'Integration client secret', env: 'SHARETRIBE_CLIENT_SECRET', secret: true },
      { label: 'Marketplace client ID', env: 'SHARETRIBE_MP_CLIENT_ID' },
      { label: 'Marketplace client secret', env: 'SHARETRIBE_MP_CLIENT_SECRET', secret: true },
      { label: 'NILiance base URL', env: 'NILIANCE_BASE_URL' },
      { label: 'NILiance API key', env: 'NILIANCE_API_KEY', secret: true },
    ],
  },
  {
    name: 'CRM',
    module: 'Contact sync',
    summary: 'Post-purchase contact + lead sync. No-op when blank.',
    steps: [
      'Get the REST URL of your CRM (e.g. HubSpot/Salesforce/custom).',
      'Get an API key with write access to contacts + deals.',
    ],
    keys: [
      { label: 'API URL', env: 'CRM_API_URL' },
      { label: 'API key', env: 'CRM_API_KEY', secret: true },
    ],
  },
  {
    name: 'Subdomain routing',
    module: 'Sites, EPKs, Podcasts, Stores',
    summary:
      'Middleware rewrites *.mytalentsite.com (sites), *.talentepk.com (EPKs), *.podcastfortalent.com (podcasts), and *.nilstores.com (stores) to the right tenant.',
    steps: [
      'Point DNS for *.mytalentsite.com, *.talentepk.com, *.podcastfortalent.com, and *.nilstores.com at Vercel (CNAME → cname.vercel-dns.com).',
      'Add the apex domains in Vercel → Project → Domains.',
    ],
    keys: [
      { label: 'Sites root', env: 'NEXT_PUBLIC_SITES_ROOT_DOMAIN' },
      { label: 'EPK root', env: 'NEXT_PUBLIC_EPK_ROOT_DOMAIN' },
      { label: 'Store root', env: 'NEXT_PUBLIC_STORE_ROOT_DOMAIN' },
    ],
  },
]

export default async function IntegrationsAdminPage() {
  await requireAdmin()
  const status = GROUPS.map((g) => ({
    ...g,
    keys: g.keys.map((k) => ({ ...k, present: Boolean(process.env[k.env]) })),
  }))
  return <IntegrationsAdmin groups={status} />
}
