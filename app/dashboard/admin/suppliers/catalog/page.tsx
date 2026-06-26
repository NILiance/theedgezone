import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { CatalogApprovalManager } from './catalog-manager'

export const metadata = { title: 'Catalog approval' }

interface PageProps {
  searchParams: Promise<{ supplier?: string; status?: string; q?: string }>
}

export default async function CatalogApprovalPage({ searchParams }: PageProps) {
  await requireAdmin()
  const { supplier, status, q } = await searchParams
  const statusFilter = status ?? 'pending'

  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }

  let query = supabase
    .from('supplier_products')
    .select(
      'id, supplier_code, supplier_sku, name, brand, category, base_price_cents, suggested_msrp_cents, primary_image_url, approved'
    )
    .order('approved', { ascending: true })
    .order('name', { ascending: true })
    .limit(200)
  if (statusFilter === 'pending') query = query.eq('approved', false)
  else if (statusFilter === 'approved') query = query.eq('approved', true)
  if (supplier) query = query.eq('supplier_code', supplier)
  if (q) query = query.ilike('name', `%${q}%`)

  const [{ data: products }, { data: suppliers }, { count: pendingCount }] = await Promise.all([
    query,
    supabase
      .from('supplier_credentials')
      .select('supplier_code, display_name')
      .order('display_name', { ascending: true }),
    supabase
      .from('supplier_products')
      .select('id', { count: 'exact', head: true })
      .eq('approved', false),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/suppliers"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Suppliers
        </Link>
        <p className="text-eyebrow mt-3 text-primary">Catalog approval</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
          Curate the supplier catalog
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Only <strong>approved</strong> products appear in the talent catalog browser. Newly
          synced products land here as <strong>pending</strong> until you approve them.{' '}
          {typeof pendingCount === 'number' && pendingCount > 0 && (
            <span className="text-accent">{pendingCount} pending review.</span>
          )}
        </p>
      </div>
      <CatalogApprovalManager
        products={(products ?? []).map((p) => ({
          id: p.id,
          supplier_code: p.supplier_code,
          supplier_sku: p.supplier_sku,
          name: p.name,
          brand: p.brand ?? null,
          category: p.category ?? null,
          base_price_cents: p.base_price_cents,
          suggested_msrp_cents: p.suggested_msrp_cents ?? null,
          primary_image_url: p.primary_image_url ?? null,
          approved: Boolean(p.approved),
        }))}
        suppliers={suppliers ?? []}
        filters={{ supplier: supplier ?? '', status: statusFilter, q: q ?? '' }}
      />
    </div>
  )
}
