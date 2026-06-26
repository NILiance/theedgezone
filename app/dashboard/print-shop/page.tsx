import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatEasternDate } from '@/lib/format-date'

export const metadata = { title: 'Print Shop' }

export default async function PrintShopPage() {
  const user = await requireUser()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const [{ data: products }, { data: orders }] = await Promise.all([
    supabase
      .from('print_products')
      .select('id, slug, name, description, category, cover_image_url, base_price_cents, lead_time_days')
      .eq('active', true)
      .order('position', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('print_orders')
      .select('id, product_id, status, amount_cents, quantity, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const productById = new Map((products ?? []).map((p) => [p.id, p]))

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <p className="text-eyebrow mt-3 text-accent">Print Shop</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
          Order physical print for NIL appearances
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Banners, business cards, flyers, signage. Upload artwork or use what we generated from
          your Brand Design. We ship directly to your address or event venue.
        </p>
      </div>

      <section>
        <p className="text-eyebrow mb-3 text-primary">Catalog</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/print-shop/${p.slug}`}
              className="group block overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40 transition hover:border-primary/40"
            >
              <div className="aspect-[4/3] bg-panel-elevated">
                {p.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <p className="text-eyebrow text-muted-foreground">{p.category.replace('_', ' ')}</p>
                <p className="text-display mt-1 font-bold">{p.name}</p>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-display text-lg font-black text-primary">
                    from ${(p.base_price_cents / 100).toFixed(0)}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.lead_time_days}d lead
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {(products ?? []).length === 0 && (
            <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground sm:col-span-3">
              No print products in the catalog yet.
            </p>
          )}
        </div>
      </section>

      {(orders ?? []).length > 0 && (
        <section>
          <p className="text-eyebrow mb-3 text-primary">Your orders</p>
          <div className="space-y-2">
            {(orders ?? []).map((o) => {
              const product = productById.get(o.product_id)
              return (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-4"
                >
                  <div>
                    <p className="text-display font-bold">{product?.name ?? 'Print order'}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {o.quantity} · ${(o.amount_cents / 100).toFixed(2)} ·{' '}
                      {formatEasternDate(o.created_at)}
                    </p>
                  </div>
                  <StatusPill status={o.status} />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'delivered' || status === 'shipped'
      ? 'bg-success/20 text-success'
      : status === 'cancelled'
      ? 'bg-destructive/20 text-destructive'
      : status === 'paid' || status === 'in_production'
      ? 'bg-accent/20 text-accent'
      : 'bg-panel-elevated text-muted-foreground'
  return (
    <span
      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
