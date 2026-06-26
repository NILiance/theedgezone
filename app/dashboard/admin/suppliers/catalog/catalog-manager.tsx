'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { setSupplierProductApproval, bulkApproveSupplierProducts } from './actions'

interface CatalogProduct {
  id: string
  supplier_code: string
  supplier_sku: string
  name: string
  brand: string | null
  category: string | null
  base_price_cents: number
  suggested_msrp_cents: number | null
  primary_image_url: string | null
  approved: boolean
}

interface Props {
  products: CatalogProduct[]
  suppliers: { supplier_code: string; display_name: string }[]
  filters: { supplier: string; status: string; q: string }
}

export function CatalogApprovalManager({ products, suppliers, filters }: Props) {
  // Local approval overlay so toggles reflect immediately without a reload.
  const [approvals, setApprovals] = useState<Record<string, boolean>>(
    Object.fromEntries(products.map((p) => [p.id, p.approved]))
  )
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const toggle = (id: string, next: boolean) => {
    setApprovals((a) => ({ ...a, [id]: next }))
    startTransition(async () => {
      const res = await setSupplierProductApproval(id, next)
      if (!res.ok) {
        setApprovals((a) => ({ ...a, [id]: !next })) // revert
        setMsg(res.message ?? 'Update failed')
      }
    })
  }

  const bulk = (next: boolean) => {
    const ids = products.map((p) => p.id)
    setApprovals((a) => ({ ...a, ...Object.fromEntries(ids.map((id) => [id, next])) }))
    setMsg(null)
    startTransition(async () => {
      const res = await bulkApproveSupplierProducts(ids, next)
      setMsg(
        res.ok
          ? `${next ? 'Approved' : 'Unapproved'} ${res.count ?? ids.length} product(s).`
          : res.message ?? 'Bulk update failed'
      )
    })
  }

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Supplier
          </label>
          <select
            name="supplier"
            defaultValue={filters.supplier}
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s.supplier_code} value={s.supplier_code}>
                {s.display_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Status
          </label>
          <select
            name="status"
            defaultValue={filters.status}
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="all">All</option>
          </select>
        </div>
        <input
          type="text"
          name="q"
          defaultValue={filters.q}
          placeholder="Search name"
          className="flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit">Apply</Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{products.length} shown</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => bulk(true)} disabled={isPending || products.length === 0}>
            Approve all shown
          </Button>
          <Button size="sm" variant="ghost" onClick={() => bulk(false)} disabled={isPending || products.length === 0}>
            Unapprove all shown
          </Button>
        </div>
        {msg && <span className="w-full text-[11px] text-muted-foreground">{msg}</span>}
      </div>

      {products.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-8 text-center text-sm text-muted-foreground">
          No products match. Sync a supplier catalog or adjust the filters.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const approved = approvals[p.id] ?? p.approved
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40"
              >
                <div className="flex gap-3 p-3">
                  {p.primary_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.primary_image_url}
                      alt={p.name}
                      className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-panel-elevated/40 text-[9px] text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                      {p.supplier_code} · {p.supplier_sku}
                    </p>
                    <p className="mt-1 text-xs text-primary">
                      ${(p.base_price_cents / 100).toFixed(2)}
                      {p.suggested_msrp_cents
                        ? ` · MSRP $${(p.suggested_msrp_cents / 100).toFixed(2)}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border px-3 py-2">
                  <span
                    className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      approved ? 'bg-success/20 text-success' : 'bg-accent/20 text-accent'
                    }`}
                  >
                    {approved ? 'Approved' : 'Pending'}
                  </span>
                  <Button
                    size="sm"
                    variant={approved ? 'ghost' : 'outline'}
                    onClick={() => toggle(p.id, !approved)}
                    disabled={isPending}
                  >
                    {approved ? 'Unapprove' : 'Approve'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
