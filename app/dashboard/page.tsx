import { requireUser } from '@/lib/auth'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = { title: 'Dashboard' }

const LIVE = [
  { name: 'Authentication', detail: 'Email/password sign-in, session management' },
  { name: 'User profiles', detail: 'Display name, avatar, role assignments' },
  {
    name: 'Subdomain routing',
    detail: '*.mytalentsite.com, *.talentepk.com, *.podcastfortalent.com',
  },
  {
    name: 'Custom domains',
    detail: 'O(1) lookup table ready for Vercel API wiring',
  },
]

const ROADMAP = [
  {
    phase: 'Phase 1',
    name: 'Marketplace + Fulfillment',
    detail: 'Catalog, Stripe webhooks, provisioning',
  },
  {
    phase: 'Phase 2',
    name: 'Brand Design + EPK',
    detail: 'Ideogram, multi-logo, brand kits, press kits',
  },
  {
    phase: 'Phase 3',
    name: 'Talent Site Builder',
    detail: 'Block editor, themes, subdomain + custom domain',
  },
  {
    phase: 'Phase 4',
    name: 'NIL Stores + Apps',
    detail: 'POD storefronts, mobile app builder',
  },
  { phase: 'Phase 5', name: 'Podcast', detail: 'RSS, episodes, distribution' },
  {
    phase: 'Phase 6',
    name: 'Climb',
    detail: 'Path-to-Summit experience + Climb Studio',
  },
  {
    phase: 'Phase 7',
    name: 'NILiance bridge',
    detail: 'Sharetribe sync, listings, opportunities',
  },
  {
    phase: 'Phase 8',
    name: 'Cutover',
    detail: 'Data migration, DNS swap, WP sunset',
  },
]

export default async function DashboardPage() {
  const user = await requireUser()

  return (
    <div className="space-y-10">
      <div>
        <p className="text-eyebrow text-accent">Edge Zone Dashboard</p>
        <h1 className="text-display mt-2 text-4xl font-black tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-muted-foreground">{user.email}</p>
      </div>

      <section>
        <h2 className="text-eyebrow mb-4 text-muted-foreground">What&apos;s live</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {LIVE.map((item) => (
            <Card key={item.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="inline-block h-2 w-2 rounded-full bg-success" />
                  {item.name}
                </CardTitle>
                <CardDescription>{item.detail}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-eyebrow mb-4 text-muted-foreground">Roadmap</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROADMAP.map((item) => (
            <Card key={item.name}>
              <CardHeader>
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  {item.phase}
                </p>
                <CardTitle className="text-base">{item.name}</CardTitle>
                <CardDescription>{item.detail}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
