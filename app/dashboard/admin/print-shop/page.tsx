import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatEasternDate } from '@/lib/format-date'
import { updatePrintOrderStatus } from './actions'

export const metadata = { title: 'Print Orders' }

export default async function AdminPrintOrdersPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: orders } = await supabase
    .from('print_orders')
    .select(
      'id, user_id, product_id, variant_label, options, quantity, amount_cents, artwork_urls, ship_to_name, ship_to_street, ship_to_city, ship_to_state, ship_to_postal, status, tracking_number, carrier, notes, created_at, paid_at, shipped_at'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  const userIds = Array.from(new Set((orders ?? []).map((o) => o.user_id)))
  const productIds = Array.from(new Set((orders ?? []).map((o) => o.product_id)))
  const { data: products } = productIds.length
    ? await supabase.from('print_products').select('id, name').in('id', productIds)
    : { data: [] as { id: string; name: string }[] }
  const productById = new Map((products ?? []).map((p) => [p.id, p]))
  const profilesById = new Map<string, { display_name: string | null; email: string | null }>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    for (const p of profiles ?? []) profilesById.set(p.id, { display_name: p.display_name, email: null })
    const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
    for (const u of usersRes?.users ?? []) {
      const existing = profilesById.get(u.id) ?? { display_name: null, email: null }
      profilesById.set(u.id, { ...existing, email: u.email ?? null })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Print orders</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Fulfillment queue</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Mark orders as in production / shipped / delivered and attach tracking when available.
        </p>
      </div>

      <div className="space-y-3">
        {(orders ?? []).map((o) => {
          const product = productById.get(o.product_id)
          const owner = profilesById.get(o.user_id)
          const tone =
            o.status === 'delivered' || o.status === 'shipped'
              ? 'bg-success/20 text-success'
              : o.status === 'cancelled'
              ? 'bg-destructive/20 text-destructive'
              : o.status === 'paid' || o.status === 'in_production'
              ? 'bg-accent/20 text-accent'
              : 'bg-panel-elevated text-muted-foreground'
          return (
            <details key={o.id} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
              <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer list-none">
                <div className="min-w-0 flex-1">
                  <p className="text-display font-bold">{product?.name ?? 'Print order'}</p>
                  <p className="text-xs text-muted-foreground">
                    {owner?.display_name ?? owner?.email ?? '—'} · Qty {o.quantity} · $
                    {(o.amount_cents / 100).toFixed(2)} ·{' '}
                    {formatEasternDate(o.created_at)}
                  </p>
                </div>
                <span
                  className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
                >
                  {o.status.replace('_', ' ')}
                </span>
              </summary>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-eyebrow text-muted-foreground">Ship to</p>
                  <p className="mt-1">
                    {o.ship_to_name}
                    <br />
                    {o.ship_to_street}
                    <br />
                    {o.ship_to_city}, {o.ship_to_state} {o.ship_to_postal}
                  </p>
                </div>
                {o.variant_label && (
                  <p>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      Variant:
                    </span>{' '}
                    {o.variant_label}
                  </p>
                )}
                {o.options && Object.keys(o.options).length > 0 && (
                  <p>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      Options:
                    </span>{' '}
                    {Object.entries(o.options as Record<string, string>)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </p>
                )}
                {Array.isArray(o.artwork_urls) && o.artwork_urls.length > 0 && (
                  <div>
                    <p className="text-eyebrow text-muted-foreground">Proof / artwork</p>
                    <div className="mt-1 flex flex-wrap gap-3">
                      {(o.artwork_urls as string[]).map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="group flex flex-col items-center gap-1"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Artwork ${i + 1}`}
                            className="h-28 w-28 rounded-[var(--radius-sm)] border border-border bg-panel-elevated object-contain group-hover:border-primary"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary group-hover:underline">
                            Download
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {o.notes && (
                  <div>
                    <p className="text-eyebrow text-muted-foreground">Notes</p>
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">{o.notes}</p>
                  </div>
                )}
                <form
                  action={updatePrintOrderStatus}
                  className="grid gap-3 rounded-[var(--radius-sm)] border border-border bg-background/40 p-3 sm:grid-cols-4"
                >
                  <input type="hidden" name="order_id" value={o.id} />
                  <select
                    name="status"
                    defaultValue={o.status}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="paid">Paid</option>
                    <option value="in_production">In production</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input
                    name="tracking_number"
                    placeholder="Tracking #"
                    defaultValue={o.tracking_number ?? ''}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    name="carrier"
                    placeholder="Carrier"
                    defaultValue={o.carrier ?? ''}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <button
                    type="submit"
                    className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
                  >
                    Update
                  </button>
                </form>
              </div>
            </details>
          )
        })}
        {(orders ?? []).length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No print orders yet.
          </p>
        )}
      </div>
    </div>
  )
}
