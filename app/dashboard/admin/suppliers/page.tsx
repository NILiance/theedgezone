import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { SupplierManager } from './manager'

export const metadata = { title: 'Suppliers' }

export default async function SuppliersAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: suppliers } = await supabase
    .from('supplier_credentials')
    .select('*')
    .order('display_name', { ascending: true })

  const { data: productCounts } = await supabase
    .from('supplier_products')
    .select('supplier_code', { count: 'exact' })

  const counts = new Map<string, number>()
  for (const row of productCounts ?? []) {
    counts.set(row.supplier_code, (counts.get(row.supplier_code) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Suppliers</p>
          <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
            NIL store catalog suppliers
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Talents pull products from these suppliers into their stores. Enable a supplier and
            paste credentials to make its catalog available. The mock supplier is enabled by
            default for development.
          </p>
        </div>
        <Link
          href="/dashboard/admin/suppliers/catalog"
          className="text-display rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary"
        >
          Catalog approval →
        </Link>
      </div>
      <SupplierManager
        suppliers={(suppliers ?? []).map((s) => ({
          ...s,
          credentials: s.credentials as Record<string, string>,
          product_count: counts.get(s.supplier_code) ?? 0,
        }))}
      />
    </div>
  )
}
