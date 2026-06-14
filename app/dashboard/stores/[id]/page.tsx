import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StoreManagerClient } from './client'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Store' }

export default async function StoreManagerPage({ params }: PageProps) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createClient()
  const [{ data: store }, { data: products }, { data: orders }] = await Promise.all([
    supabase.from('stores').select('*').eq('id', id).single(),
    supabase
      .from('store_products')
      .select(
        'id, slug, name, description, price_cents, currency, inventory, primary_image_url, tags, active, position, compare_at_cents'
      )
      .eq('store_id', id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('store_orders')
      .select(
        'id, product_id, buyer_email, buyer_name, amount_cents, currency, status, tracking_carrier, tracking_number, created_at, paid_at'
      )
      .eq('store_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  if (!store || store.user_id !== user.id) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/stores"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Stores
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-eyebrow text-accent">Store</p>
            <h1 className="text-display mt-1 text-3xl font-black tracking-tight">{store.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <code>/store/{store.slug}</code> ·{' '}
              <span
                className={
                  store.status === 'open' ? 'text-success' : 'text-muted-foreground'
                }
              >
                {store.status}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/stores/${store.id}/catalog`}
              className="text-display rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary"
            >
              + From catalog
            </Link>
            <Link href={`/store/${store.slug}`} target="_blank">
              <button className="text-display rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-panel">
                View store
              </button>
            </Link>
          </div>
        </div>
      </div>

      <StoreManagerClient
        store={{
          id: store.id,
          name: store.name,
          tagline: store.tagline ?? '',
          description: store.description ?? '',
          status: store.status,
          primary_color: store.primary_color,
          secondary_color: store.secondary_color,
          hero_image_url: store.hero_image_url ?? '',
          logo_url: store.logo_url ?? '',
          contact_email: store.contact_email ?? '',
        }}
        products={(products ?? []) as Array<{
          id: string
          name: string
          description: string | null
          price_cents: number
          compare_at_cents: number | null
          currency: string
          inventory: number | null
          primary_image_url: string | null
          tags: string[]
          active: boolean
        }>}
        orders={(orders ?? []) as Array<{
          id: string
          product_id: string | null
          buyer_email: string | null
          buyer_name: string | null
          amount_cents: number
          currency: string
          status: string
          tracking_carrier: string | null
          tracking_number: string | null
          created_at: string
          paid_at: string | null
        }>}
      />
    </div>
  )
}
