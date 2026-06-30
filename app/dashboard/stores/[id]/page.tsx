import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { StoreManagerClient } from './client'
import { StoreDesignEditor } from './design-editor'
import { DomainManager } from '@/components/dashboard/domain-manager'
import { normalizeSections } from '@/lib/store-sections'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Store' }

export default async function StoreManagerPage({ params }: PageProps) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createClient()
  const [{ data: store }, { data: products }, { data: orders }, { data: brand }] =
    await Promise.all([
      supabase.from('stores').select('*').eq('id', id).single(),
      supabase
        .from('store_products')
        .select(
          'id, slug, name, description, price_cents, currency, inventory, primary_image_url, tags, active, position, compare_at_cents, cost_cents, variants'
        )
        .eq('store_id', id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('store_orders')
        .select(
          'id, product_id, buyer_email, buyer_name, amount_cents, currency, status, tracking_carrier, tracking_number, created_at, paid_at, quantity, variant_label, fulfillment_status, supplier_order_id, fulfillment_error, cost_cents, platform_fee_cents'
        )
        .eq('store_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      // Latest finalized brand logo — the default source for POD mockups.
      supabase
        .from('brand_designs')
        .select('final_logo_url, admin_final_logo_url')
        .eq('user_id', user.id)
        .not('final_logo_url', 'is', null)
        .order('finalized_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
    ])
  if (!store || store.user_id !== user.id) return <MissingStoreState />

  const brandLogoUrl =
    (brand as { admin_final_logo_url?: string | null; final_logo_url?: string | null } | null)
      ?.admin_final_logo_url ??
    (brand as { final_logo_url?: string | null } | null)?.final_logo_url ??
    ''

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
              <code className="text-foreground">
                {store.slug}.{process.env.NEXT_PUBLIC_STORE_ROOT_DOMAIN ?? 'nilstores.com'}
              </code>{' '}
              ·{' '}
              <span
                className={store.status === 'open' ? 'text-success' : 'text-muted-foreground'}
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
        brandLogoUrl={brandLogoUrl}
        commissionBps={store.commission_bps ?? 1500}
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
        products={(products ?? []).map((p) => ({
          ...p,
          cost_cents: (p as { cost_cents?: number | null }).cost_cents ?? null,
          variants: Array.isArray((p as { variants?: unknown }).variants)
            ? ((p as { variants: unknown[] }).variants as Array<{
                size?: string
                color?: string
                sku?: string
                price_cents?: number | null
                inventory?: number | null
              }>)
            : [],
        })) as Array<{
          id: string
          name: string
          description: string | null
          price_cents: number
          compare_at_cents: number | null
          cost_cents: number | null
          currency: string
          inventory: number | null
          primary_image_url: string | null
          tags: string[]
          variants: Array<{
            size?: string
            color?: string
            sku?: string
            price_cents?: number | null
            inventory?: number | null
          }>
          active: boolean
        }>}
        orders={(orders ?? []).map((o) => ({
          ...o,
          quantity: (o as { quantity?: number }).quantity ?? 1,
          variant_label: (o as { variant_label?: string | null }).variant_label ?? null,
          fulfillment_status:
            (o as { fulfillment_status?: string | null }).fulfillment_status ?? 'unfulfilled',
          supplier_order_id:
            (o as { supplier_order_id?: string | null }).supplier_order_id ?? null,
          fulfillment_error:
            (o as { fulfillment_error?: string | null }).fulfillment_error ?? null,
          cost_cents: (o as { cost_cents?: number | null }).cost_cents ?? null,
          platform_fee_cents:
            (o as { platform_fee_cents?: number | null }).platform_fee_cents ?? null,
        })) as Array<{
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
          quantity: number
          variant_label: string | null
          fulfillment_status: string
          supplier_order_id: string | null
          fulfillment_error: string | null
          cost_cents: number | null
          platform_fee_cents: number | null
        }>}
      />

      <DomainManager
        targetType="store"
        entityId={store.id}
        slug={store.slug}
        subdomain={`${store.slug}.${process.env.NEXT_PUBLIC_STORE_ROOT_DOMAIN ?? 'nilstores.com'}`}
      />

      <StoreDesignEditor
        storeId={store.id}
        theme={
          ((store as { theme?: { heading_font?: string; body_font?: string } }).theme ?? {}) as {
            heading_font?: string
            body_font?: string
          }
        }
        sections={normalizeSections((store as { sections?: unknown }).sections)}
        products={(products ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          primary_image_url: (p as { primary_image_url?: string | null }).primary_image_url ?? null,
        }))}
      />
    </div>
  )
}

function MissingStoreState() {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/stores"
        className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← Stores
      </Link>
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
        <p className="text-eyebrow text-accent">Store not found</p>
        <h1 className="text-display mt-2 text-2xl font-black tracking-tight">
          This store no longer exists
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The link you followed points to a store that was deleted or never finished
          creating. Your other stores are still here.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard/stores">
            <Button size="sm">Back to your stores</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
