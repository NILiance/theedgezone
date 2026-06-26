import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getDashboardData, getProductActions, readinessGrade, readinessHint, getProfileSectionPercents } from '@/lib/dashboard'
import { PostPurchaseBanner } from '@/components/dashboard/post-purchase-banner'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { createClient } from '@/lib/supabase/server'
import { NilianceBanner } from '@/components/dashboard/niliance-banner'
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fulfillCheckoutSession } from '@/lib/checkout-fulfillment'
import { awardEngagement, awardProfileComplete } from '@/lib/points'

export const metadata = { title: 'Dashboard' }

interface PageProps {
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const checkoutSuccess = sp.checkout === 'success'
  const user = await requireUser()

  // Synchronous fallback for the Stripe webhook. The talent just landed
  // from checkout — if the webhook hasn't fired yet, the order row
  // doesn't exist and "My Products" looks empty. Fulfilling inline here
  // closes that gap; the call is idempotent so a webhook arriving later
  // is a no-op via the stripe_session_id existence check.
  if (checkoutSuccess && sp.session_id) {
    await fulfillCheckoutSession(sp.session_id, user.id)
  }

  // Reward engagement (one-time signup bonus + daily check-in). Idempotent —
  // safe to call every load; no-ops without a service-role key.
  await awardEngagement(user.id)

  const { profile, orders } = await getDashboardData(user.id)
  if ((profile?.profile_completion_pct ?? 0) >= 100) {
    await awardProfileComplete(user.id)
  }

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'there'
  const userType = profile?.user_type ?? 'talent'
  const completionPct = profile?.profile_completion_pct ?? 0
  const readinessScore = profile?.nil_readiness_score ?? 0
  const points = profile?.points ?? 0
  const productCount = orders.filter((o) => o.status !== 'cancelled').length
  const subCount = orders.filter((o) => o.plan === 'monthly' || o.plan === 'annual').length
  const showNilianceBanner = !profile?.niliance_banner_dismissed_at

  // Find the most recent purchase to drive the post-purchase banner.
  // Show for orders less than 30 days old that came back paid + provisioned.
  const recentOrder = orders.find((o) => {
    if (o.status === 'cancelled' || o.status === 'refunded') return false
    const days = (Date.now() - new Date(o.purchased_at).getTime()) / 86400000
    return days < 30
  })
  const sectionPercents = recentOrder ? await getProfileSectionPercents(user.id) : {}

  // Latest NILfluence calculation for the ring.
  const supabase = await createClient()
  const { data: latestScore } = await supabase
    .from('nilfluence_calculations')
    .select('result')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nilfluenceScore = (
    latestScore?.result as { nilfluence?: { nilfluence_score?: number } } | null
  )?.nilfluence?.nilfluence_score ?? null

  return (
    <div className="space-y-8">
      {checkoutSuccess && (
        <div className="rounded-[var(--radius)] border border-success/40 bg-success/10 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <p className="text-display font-bold text-foreground">Payment received</p>
              <p className="text-sm text-muted-foreground">
                Your new product is ready in &ldquo;My Products&rdquo; below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NILiance banner */}
      {showNilianceBanner && <NilianceBanner email={user.email ?? ''} />}

      {/* Post-purchase profile-completion banner */}
      {recentOrder && (
        <PostPurchaseBanner
          order={{
            product_slug: recentOrder.product_slug,
            product_title: recentOrder.product_title,
            created_at: recentOrder.purchased_at,
          }}
          sectionPercents={sectionPercents}
        />
      )}

      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-eyebrow text-accent">My Dashboard</p>
          <h1 className="text-display mt-2 flex flex-wrap items-center gap-3 text-4xl font-black tracking-tight">
            Welcome back, {displayName}
            <RoleBadge userType={userType} />
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {nilfluenceScore != null && (
            <Link href="/dashboard/nilfluence-calculator" className="hidden sm:block">
              <ScoreRing score={nilfluenceScore} size={88} thickness={8} label="NILfluence" />
            </Link>
          )}
          <Link href="/dashboard/profile">
            <Button size="sm" variant="outline">
              My Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile completion */}
      <div className="rounded-[var(--radius)] border border-border bg-panel/60 p-6 shadow-elevated">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-display text-lg font-bold text-foreground">
              Complete your profile ({completionPct}%)
            </p>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              <span className="text-display text-xs font-bold uppercase tracking-widest text-primary">
                Important Tip
              </span>
              <br />
              Take a few minutes to update your profile to get the most from your experience.
              Your profile powers personalized content, recommendations, and your roadmap.
            </p>
          </div>
          <Link href="/dashboard/profile">
            <Button>Update Profile</Button>
          </Link>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Top row: NIL Readiness + stat tiles */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* NIL Readiness score */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-[var(--radius)] border border-border bg-panel/60 p-6 shadow-elevated">
            <p className="text-eyebrow text-muted-foreground">NIL Readiness</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-display text-6xl font-black text-primary">
                {readinessScore}
              </span>
              <span className="text-display text-2xl text-muted-foreground">/ 100</span>
            </div>
            <p className="mt-1 text-display text-xl font-bold text-foreground">
              {readinessGrade(readinessScore)}
            </p>
            <p className="mt-1 text-xs text-primary">{readinessHint(readinessScore)}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Score increases as you complete profile sections, purchase services, and engage
              with opportunities.
            </p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            value={productCount.toString()}
            label="Products"
            sub={subCount > 0 ? `+${subCount} sub` : undefined}
          />
          <StatTile value={`${completionPct}%`} label="Profile" />
          <StatTile value={points.toLocaleString('en-US')} label="Points" />
          <StatTile value="0/0" label="Goals" sub="Set goals →" />
        </div>
      </div>

      {/* Dashboard tabs */}
      <DashboardTabs
        defaultTab="My Products"
        panels={{
          'My Products': <MyProductsPanel orders={orders} />,
          Orders: <OrdersPanel orders={orders} />,
          Services: <ServicesPanel />,
          Roadmap: <RoadmapPanel />,
          Resources: <ResourcesPanel />,
          Profile: (
            <ProfilePanel
              completionPct={completionPct}
              readinessScore={readinessScore}
              email={user.email ?? null}
            />
          ),
          Goals: <GoalsPanel />,
          Points: <PointsPanel points={points} />,
          'For You': <ForYouPanel />,
          Account: <AccountPanel email={user.email ?? null} userType={userType} />,
          Support: <SupportPanel />,
          Insights: <InsightsPanel />,
        }}
      />
    </div>
  )
}

// ── Tab panels — each replaces "Coming soon" with real content + a CTA
//    to the matching full page so the dashboard feels like a launchpad.

function PanelShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-6">
      <p className="text-eyebrow text-primary">{title}</p>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

function ServicesPanel() {
  const featured: Array<{ slug: string; title: string; blurb: string }> = [
    {
      slug: 'personal-brand-design',
      title: 'Personal Brand Design',
      blurb: '20 concepts + brand kit. The cornerstone of every NIL deal.',
    },
    {
      slug: 'personal-website',
      title: 'Personal Website',
      blurb: 'Drag-and-drop site builder with revenue blocks.',
    },
    {
      slug: 'electronic-press-kit',
      title: 'Electronic Press Kit',
      blurb: 'Pitch-ready EPK with stats, story, and a shareable magic link.',
    },
  ]
  return (
    <PanelShell
      title="Services"
      description="Browse every NIL tool and program built for talent. New services drop monthly."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {featured.map((s) => (
          <Link
            key={s.slug}
            href={`/services/${s.slug}`}
            className="block rounded-[var(--radius-sm)] border border-border bg-panel-elevated p-4 transition-colors hover:border-primary/50"
          >
            <p className="text-display text-sm font-bold">{s.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.blurb}</p>
          </Link>
        ))}
      </div>
      <Link href="/services" className="mt-4 inline-block">
        <Button>Browse all services →</Button>
      </Link>
    </PanelShell>
  )
}

function RoadmapPanel() {
  return (
    <PanelShell
      title="Roadmap"
      description="Your personalized NIL roadmap. Adds milestones based on the services you've purchased and the gaps in your profile."
    >
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/roadmap">
          <Button>Open my roadmap →</Button>
        </Link>
        <Link href="/roadmap">
          <Button variant="outline">View the free roadmap</Button>
        </Link>
      </div>
    </PanelShell>
  )
}

function ResourcesPanel() {
  return (
    <PanelShell
      title="Resources"
      description="Templates, guides, and tools curated by the Edge Zone team. Pulled fresh as you complete more of your profile."
    >
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/resources">
          <Button>My resources →</Button>
        </Link>
        <Link href="/resources">
          <Button variant="outline">Free resources</Button>
        </Link>
      </div>
    </PanelShell>
  )
}

function ProfilePanel({
  completionPct,
  readinessScore,
  email,
}: {
  completionPct: number
  readinessScore: number
  email: string | null
}) {
  return (
    <PanelShell
      title="Profile"
      description="Your athlete profile drives every recommendation, matching engine, and brand pitch. Higher completion → better matches."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <SmallStat value={`${completionPct}%`} label="Profile complete" />
        <SmallStat value={`${readinessScore}/100`} label="NIL readiness" />
        <SmallStat value={email ? email.split('@')[0]! : '—'} label="Display name" />
      </div>
      <Link href="/dashboard/profile" className="mt-4 inline-block">
        <Button>Edit profile →</Button>
      </Link>
    </PanelShell>
  )
}

function GoalsPanel() {
  const examples = [
    'Sign 3 NIL deals this season',
    'Grow Instagram to 25k followers',
    'Publish 12 brand-aligned content pieces',
    'Land a podcast guest spot',
  ]
  return (
    <PanelShell
      title="Goals"
      description="Set the targets that matter — we'll surface the services, opportunities, and roadmap milestones that get you there."
    >
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {examples.map((g) => (
          <li
            key={g}
            className="rounded-[var(--radius-sm)] border border-dashed border-border bg-background px-3 py-2 text-muted-foreground"
          >
            • {g}
          </li>
        ))}
      </ul>
      <Link href="/dashboard/profile?tab=goals" className="mt-4 inline-block">
        <Button>Set my goals →</Button>
      </Link>
    </PanelShell>
  )
}

function PointsPanel({ points }: { points: number }) {
  return (
    <PanelShell
      title="Points"
      description="Earn points for every action that grows your NIL footprint — finished profile sections, purchases, fan submissions, completed roadmap milestones."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <SmallStat value={points.toLocaleString('en-US')} label="Points balance" />
        <div className="flex items-center">
          <Link href="/dashboard/rewards" className="w-full">
            <Button className="w-full">Open rewards store →</Button>
          </Link>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Earn points from daily check-ins, completing your profile, and purchases — then redeem them
        in the rewards store.
      </p>
    </PanelShell>
  )
}

function ForYouPanel() {
  return (
    <PanelShell
      title="For You"
      description="Personalized opportunities, brand matches, and content prompts based on your profile + activity."
    >
      <div className="flex flex-wrap gap-3">
        <Link href="/opportunities">
          <Button>Browse opportunities →</Button>
        </Link>
        <Link href="/dashboard/nilfluence-calculator">
          <Button variant="outline">Run NILfluence calculator</Button>
        </Link>
      </div>
    </PanelShell>
  )
}

function AccountPanel({ email, userType }: { email: string | null; userType: string }) {
  return (
    <PanelShell
      title="Account"
      description="Sign-in details, role, and security. Manage how you log in and what notifications you get."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <SmallStat value={email ?? '—'} label="Email" />
        <SmallStat value={userType.toUpperCase()} label="Role" />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/dashboard/profile">
          <Button>Account settings →</Button>
        </Link>
        <form action="/api/auth/signout" method="post">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </PanelShell>
  )
}

function SupportPanel() {
  return (
    <PanelShell
      title="Support"
      description="Hit a snag? Open a ticket and our team responds within 1-2 business days. Urgent NIL deal issues are prioritized."
    >
      <Link href="/dashboard/support">
        <Button>Open support →</Button>
      </Link>
    </PanelShell>
  )
}

function InsightsPanel() {
  return (
    <PanelShell
      title="Insights"
      description="Profile views, site traffic, opportunity match rate, and content performance — all rolled up so you know what's moving your brand."
    >
      <Link href="/dashboard/insights">
        <Button>View my insights →</Button>
      </Link>
    </PanelShell>
  )
}

function SmallStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-panel-elevated p-3">
      <p className="text-display truncate text-lg font-black text-primary" title={value}>
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function RoleBadge({ userType }: { userType: string }) {
  return (
    <span className="text-display rounded-full bg-panel-elevated px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground">
      {userType}
    </span>
  )
}

function StatTile({
  value,
  label,
  sub,
}: {
  value: string
  label: string
  sub?: string
}) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/60 p-5 text-center shadow-elevated">
      <p className="text-display text-3xl font-black text-primary">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {sub && (
        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {sub}
        </p>
      )}
    </div>
  )
}

function MyProductsPanel({ orders }: { orders: Awaited<ReturnType<typeof getDashboardData>>['orders'] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-10 text-center">
        <p className="text-display text-lg font-bold text-foreground">
          You haven&apos;t purchased anything yet.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Browse the services catalog to find the tools, programs, and services that fit your
          goals.
        </p>
        <Link href="/services" className="mt-6 inline-block">
          <Button size="lg">BROWSE SERVICES →</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <ProductCard key={order.id} order={order} />
      ))}
    </div>
  )
}

function ProductCard({
  order,
}: {
  order: Awaited<ReturnType<typeof getDashboardData>>['orders'][number]
}) {
  const actions = getProductActions(order.product_slug, order.provisioned_entity_id)
  const dateStr = new Date(order.purchased_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const planLabel = order.plan === 'monthly' ? 'Monthly' : order.plan === 'annual' ? 'Annual' : 'Onetime'

  return (
    <article className="rounded-[var(--radius)] border border-border bg-panel p-6 shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-display font-bold text-foreground">{order.product_title}</p>
          <p className="text-xs text-muted-foreground">{planLabel}</p>
        </div>
        <StatusPill status={order.status} />
      </div>
      {order.thumbnail_url && (
        <div className="mt-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.thumbnail_url}
            alt={`${order.product_title} preview`}
            className="max-h-full max-w-full object-contain p-3"
          />
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Purchased {dateStr}</p>
      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button size="sm" variant="outline">
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase()
  return (
    <span
      className={cn(
        'text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest',
        normalized === 'READY' && 'bg-success/20 text-success',
        normalized === 'ACTIVE' && 'bg-primary/20 text-primary',
        normalized === 'PROVISIONING' && 'bg-accent/20 text-accent',
        normalized === 'PAID' && 'bg-success/20 text-success',
        (normalized === 'PENDING' || normalized === 'CANCELLED' || normalized === 'REFUNDED') &&
          'bg-panel-elevated text-muted-foreground'
      )}
    >
      {normalized}
    </span>
  )
}

function OrdersPanel({ orders }: { orders: Awaited<ReturnType<typeof getDashboardData>>['orders'] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-10 text-center">
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-panel-elevated">
          <tr>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Product
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Plan
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3 text-foreground">{order.product_title}</td>
              <td className="px-4 py-3 text-muted-foreground">{order.plan ?? 'onetime'}</td>
              <td className="px-4 py-3 text-right font-bold text-primary">
                {order.amount_cents != null
                  ? `$${(order.amount_cents / 100).toFixed(2)}`
                  : '—'}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={order.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(order.purchased_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
