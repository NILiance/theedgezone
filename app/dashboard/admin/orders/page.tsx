import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { OrdersFilters } from './orders-filters'

export const metadata = { title: 'Orders' }

interface PageProps {
  searchParams: Promise<{ status?: string; plan?: string; q?: string }>
}

export default async function OrdersAdminPage({ searchParams }: PageProps) {
  await requireAdmin()
  const sp = await searchParams
  const supabase = createServiceClient()

  if (!supabase) {
    return (
      <div className="rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-6">
        <p className="text-sm text-accent">
          The orders viewer needs <code>SUPABASE_SERVICE_ROLE_KEY</code> on the deploy to read
          across all users.
        </p>
      </div>
    )
  }

  let query = supabase
    .from('orders')
    .select(
      'id, product_slug, product_title, plan, amount_cents, currency, status, purchased_at, user_id, stripe_payment_intent, stripe_session_id, crm_synced_at'
    )
    .order('purchased_at', { ascending: false })
    .limit(500)

  if (sp.status) query = query.eq('status', sp.status)
  if (sp.plan) query = query.eq('plan', sp.plan)
  if (sp.q) query = query.ilike('product_title', `%${sp.q}%`)

  const { data: orders, count } = await query

  // Pull profile display names + emails so the table shows who bought what.
  const userIds = Array.from(new Set((orders ?? []).map((o) => o.user_id))).filter(Boolean) as string[]
  const profilesById = new Map<string, { display_name: string | null; email: string | null }>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      profilesById.set(p.id, { display_name: p.display_name, email: null })
    }
    // Pull emails from auth.users via the admin SDK
    const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
    for (const u of usersRes?.users ?? []) {
      const existing = profilesById.get(u.id) ?? { display_name: null, email: null }
      profilesById.set(u.id, { ...existing, email: u.email ?? null })
    }
  }

  // Aggregates for the stat strip
  const totalRevenueCents = (orders ?? [])
    .filter((o) => o.status === 'paid' || o.status === 'ready')
    .reduce((sum, o) => sum + (o.amount_cents ?? 0), 0)
  const statusCounts = new Map<string, number>()
  for (const o of orders ?? []) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-eyebrow text-primary">Orders</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
          Marketplace orders
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Showing" value={(orders ?? []).length.toLocaleString()} />
        <Stat label="Paid revenue" value={`$${(totalRevenueCents / 100).toFixed(0)}`} />
        <Stat label="Ready" value={statusCounts.get('ready')?.toLocaleString() ?? '0'} />
        <Stat label="Provisioning" value={statusCounts.get('provisioning')?.toLocaleString() ?? '0'} />
        <Stat label="Refunded" value={statusCounts.get('refunded')?.toLocaleString() ?? '0'} />
      </div>

      <OrdersFilters status={sp.status} plan={sp.plan} q={sp.q} />

      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/30">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Plan</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-center">CRM</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => {
              const profile = profilesById.get(o.user_id) ?? null
              return (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(o.purchased_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-display text-foreground">{o.product_title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      <code>{o.product_slug}</code>
                    </p>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <p>{profile?.display_name ?? '—'}</p>
                    {profile?.email && (
                      <p className="text-muted-foreground">{profile.email}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground">
                    {o.plan ?? 'onetime'}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-primary">
                    {o.amount_cents != null
                      ? `$${(o.amount_cents / 100).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-3 py-2 text-center text-xs">
                    {o.crm_synced_at ? '✓' : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/dashboard/admin/orders/${o.id}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                  No orders match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {count != null && count > 500 && (
        <p className="text-xs text-muted-foreground">
          Showing 500 of {count.toLocaleString()} matching orders. Tighten filters to drill in.
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className="text-display mt-1 text-2xl font-black text-primary">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase()
  const tone =
    normalized === 'PAID' || normalized === 'READY'
      ? 'bg-success/20 text-success'
      : normalized === 'PROVISIONING'
      ? 'bg-accent/20 text-accent'
      : normalized === 'REFUNDED' || normalized === 'CANCELLED'
      ? 'bg-destructive/20 text-destructive'
      : 'bg-panel-elevated text-muted-foreground'
  return (
    <span
      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
    >
      {normalized}
    </span>
  )
}
