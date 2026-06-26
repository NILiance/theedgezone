import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CatalogBrowser } from './browser'

export const metadata = { title: 'Add from supplier catalog' }

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; supplier?: string }>
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { id: storeId } = await params
  const { q, supplier: supplierFilter } = await searchParams
  const user = await requireUser()
  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('id, name, user_id')
    .eq('id', storeId)
    .single()
  if (!store || store.user_id !== user.id) notFound()

  const service = createServiceClient()
  let products: Array<{
    id: string
    supplier_code: string
    supplier_sku: string
    name: string
    brand: string | null
    category: string | null
    base_price_cents: number
    suggested_msrp_cents: number | null
    primary_image_url: string | null
    color_options: string[]
    size_options: string[]
    inventory_total: number | null
  }> = []
  let suppliers: { supplier_code: string; display_name: string }[] = []

  if (service) {
    let query = service
      .from('supplier_products')
      .select(
        'id, supplier_code, supplier_sku, name, brand, category, base_price_cents, suggested_msrp_cents, primary_image_url, color_options, size_options, inventory_total'
      )
      .eq('active', true)
      .eq('approved', true)
      .order('name', { ascending: true })
      .limit(60)
    if (q) {
      query = query.ilike('name', `%${q}%`)
    }
    if (supplierFilter) {
      query = query.eq('supplier_code', supplierFilter)
    }
    const { data } = await query
    products = (data ?? []).map((p) => ({
      ...p,
      color_options: (p.color_options as string[]) ?? [],
      size_options: (p.size_options as string[]) ?? [],
    }))

    const { data: enabled } = await service
      .from('supplier_credentials')
      .select('supplier_code, display_name')
      .eq('enabled', true)
      .order('display_name', { ascending: true })
    suppliers = enabled ?? []
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/stores/${storeId}`}
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← {store.name}
        </Link>
        <p className="text-eyebrow mt-3 text-accent">Catalog</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
          Add from supplier catalog
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Browse pre-synced products from connected suppliers. When you import one, we keep it in
          sync — price + inventory refresh nightly. You set the retail markup.
        </p>
      </div>

      <form className="flex flex-wrap gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search products"
          className="flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          name="supplier"
          defaultValue={supplierFilter ?? ''}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.supplier_code} value={s.supplier_code}>
              {s.display_name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground"
        >
          Search
        </button>
      </form>

      {!service && (
        <p className="rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
          Service role key missing — admin needs to configure suppliers first.
        </p>
      )}
      {service && products.length === 0 && (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
          No products match. Try a different search, or ask admin to sync a supplier catalog.
        </p>
      )}

      <CatalogBrowser storeId={storeId} products={products} />
    </div>
  )
}
