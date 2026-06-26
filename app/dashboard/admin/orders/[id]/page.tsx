import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatEastern } from '@/lib/format-date'
import { OrderActions } from './order-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Order detail' }

export default async function OrderDetailPage({ params }: PageProps) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing — can&apos;t read order detail.
      </p>
    )
  }

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, product_slug, product_title, plan, amount_cents, currency, status, purchased_at, stripe_session_id, stripe_payment_intent, crm_synced_at, provisioned_entity_id, provisioned_at, fulfillment_notes, user_id'
    )
    .eq('id', id)
    .single()

  if (!order) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, niliance_user_id, sport, school')
    .eq('id', order.user_id)
    .maybeSingle()

  const { data: userRes } = await supabase.auth.admin.getUserById(order.user_id)
  const email = userRes?.user?.email ?? null

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/orders"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Orders
        </Link>
        <h2 className="text-display mt-2 text-2xl font-black tracking-tight">
          {order.product_title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <code>{order.product_slug}</code> ·{' '}
          {formatEastern(order.purchased_at)}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
            <p className="text-eyebrow text-primary">Summary</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <DetailRow label="Status" value={order.status.toUpperCase()} />
              <DetailRow label="Plan" value={order.plan ?? 'onetime'} />
              <DetailRow
                label="Amount"
                value={
                  order.amount_cents != null
                    ? `$${(order.amount_cents / 100).toFixed(2)} ${(order.currency ?? 'usd').toUpperCase()}`
                    : '—'
                }
              />
              <DetailRow
                label="CRM sync"
                value={order.crm_synced_at ? formatEastern(order.crm_synced_at) : '—'}
              />
              <DetailRow
                label="Provisioned"
                value={
                  order.provisioned_at
                    ? formatEastern(order.provisioned_at)
                    : '—'
                }
              />
              <DetailRow
                label="Provisioned entity"
                value={
                  order.provisioned_entity_id ? (
                    <Link
                      href={`/dashboard/sites/${order.provisioned_entity_id}`}
                      className="text-primary hover:underline"
                    >
                      Open
                    </Link>
                  ) : (
                    '—'
                  )
                }
              />
            </dl>
          </section>

          <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
            <p className="text-eyebrow text-primary">Stripe</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <DetailRow
                label="Checkout session"
                value={
                  order.stripe_session_id ? (
                    <a
                      href={`https://dashboard.stripe.com/payments/${order.stripe_session_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-mono text-xs text-primary hover:underline"
                    >
                      {order.stripe_session_id}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailRow
                label="Payment intent"
                value={
                  order.stripe_payment_intent ? (
                    <a
                      href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-mono text-xs text-primary hover:underline"
                    >
                      {order.stripe_payment_intent}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
            </dl>
          </section>

          <OrderActions
            orderId={order.id}
            currentStatus={order.status}
            currentNotes={order.fulfillment_notes ?? ''}
          />
        </div>

        <aside className="space-y-5">
          <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
            <p className="text-eyebrow text-primary">Customer</p>
            <dl className="mt-3 space-y-2 text-sm">
              <DetailRow label="Name" value={profile?.display_name ?? '—'} />
              <DetailRow label="Email" value={email ?? '—'} />
              <DetailRow label="Sport" value={profile?.sport ?? '—'} />
              <DetailRow label="School" value={profile?.school ?? '—'} />
              <DetailRow label="NILiance ID" value={profile?.niliance_user_id ?? '—'} />
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  )
}
