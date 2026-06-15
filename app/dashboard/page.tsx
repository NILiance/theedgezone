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

export const metadata = { title: 'Dashboard' }

interface PageProps {
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const checkoutSuccess = sp.checkout === 'success'
  const user = await requireUser()
  const { profile, orders } = await getDashboardData(user.id)

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
                Your new product will appear in &ldquo;My Products&rdquo; below within a few
                seconds (provisioning runs after the Stripe webhook confirms).
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
        }}
      />
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
