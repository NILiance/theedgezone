import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Integrations' }

type Group = {
  name: string
  module: string
  keys: { label: string; env: string; secret?: boolean }[]
}

const GROUPS: Group[] = [
  {
    name: 'Stripe',
    module: 'Payments',
    keys: [
      { label: 'Publishable key', env: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' },
      { label: 'Secret key', env: 'STRIPE_SECRET_KEY', secret: true },
      { label: 'Webhook secret', env: 'STRIPE_WEBHOOK_SECRET', secret: true },
      { label: 'Connect webhook secret', env: 'STRIPE_CONNECT_WEBHOOK_SECRET', secret: true },
    ],
  },
  {
    name: 'Supabase',
    module: 'Database + Auth + Storage',
    keys: [
      { label: 'URL', env: 'NEXT_PUBLIC_SUPABASE_URL' },
      { label: 'Anon key', env: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' },
      { label: 'Service role key', env: 'SUPABASE_SERVICE_ROLE_KEY', secret: true },
    ],
  },
  {
    name: 'Anthropic',
    module: 'Generate actions',
    keys: [{ label: 'API key', env: 'ANTHROPIC_API_KEY', secret: true }],
  },
  {
    name: 'Ideogram',
    module: 'Brand Design logo generation',
    keys: [{ label: 'API key', env: 'IDEOGRAM_API_KEY', secret: true }],
  },
  {
    name: 'Resend',
    module: 'Transactional email',
    keys: [
      { label: 'API key', env: 'RESEND_API_KEY', secret: true },
      { label: 'From address', env: 'RESEND_FROM_ADDRESS' },
    ],
  },
  {
    name: 'Vercel',
    module: 'Custom domains',
    keys: [
      { label: 'API token', env: 'VERCEL_API_TOKEN', secret: true },
      { label: 'Project ID', env: 'VERCEL_PROJECT_ID' },
      { label: 'Team ID', env: 'VERCEL_TEAM_ID' },
    ],
  },
  {
    name: 'Google Drive',
    module: 'Brand kit ZIP storage',
    keys: [
      { label: 'Service account email', env: 'GOOGLE_SERVICE_ACCOUNT_EMAIL' },
      { label: 'Service account key', env: 'GOOGLE_SERVICE_ACCOUNT_KEY', secret: true },
      { label: 'Shared drive ID', env: 'GOOGLE_SHARED_DRIVE_ID' },
    ],
  },
  {
    name: 'Sharetribe',
    module: 'NILiance marketplace bridge',
    keys: [
      { label: 'Integration client ID', env: 'SHARETRIBE_INTEGRATION_CLIENT_ID' },
      { label: 'Integration client secret', env: 'SHARETRIBE_INTEGRATION_CLIENT_SECRET', secret: true },
      { label: 'Marketplace client ID', env: 'SHARETRIBE_MARKETPLACE_CLIENT_ID' },
      { label: 'Marketplace client secret', env: 'SHARETRIBE_MARKETPLACE_CLIENT_SECRET', secret: true },
    ],
  },
  {
    name: 'Phyllo',
    module: 'Creator identity verification',
    keys: [
      { label: 'Client ID', env: 'PHYLLO_CLIENT_ID' },
      { label: 'Client secret', env: 'PHYLLO_CLIENT_SECRET', secret: true },
      { label: 'Environment', env: 'PHYLLO_ENV' },
    ],
  },
  {
    name: 'Site routing',
    module: 'Subdomain edge middleware',
    keys: [
      { label: 'Sites root', env: 'NEXT_PUBLIC_SITES_ROOT_DOMAIN' },
      { label: 'EPK root', env: 'NEXT_PUBLIC_EPK_ROOT_DOMAIN' },
    ],
  },
]

export default async function IntegrationsAdminPage() {
  await requireAdmin()
  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Integrations</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">External system status</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Read-only view of which API credentials are present in the deployment environment. Edit
          credentials in Vercel project settings (or <code className="font-mono">.env.local</code> for
          dev) — never store secrets in this UI.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <div key={g.name} className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-display text-base font-black">{g.name}</p>
              <p className="text-eyebrow text-[10px] text-muted-foreground">{g.module}</p>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {g.keys.map((k) => {
                const present = Boolean(process.env[k.env])
                return (
                  <li key={k.env} className="flex items-center justify-between gap-2">
                    <span>
                      <span className="block font-semibold">{k.label}</span>
                      <code className="block font-mono text-[10px] text-muted-foreground">{k.env}</code>
                    </span>
                    <span
                      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        present
                          ? 'bg-success/20 text-success'
                          : k.secret
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-panel-elevated text-muted-foreground'
                      }`}
                    >
                      {present ? 'set' : 'missing'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
