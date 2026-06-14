'use client'

import { useActionState, useState } from 'react'
import { importSupplierProduct, type ImportState } from './actions'

type Product = {
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
}

export function CatalogBrowser({ storeId, products }: { storeId: string; products: Product[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} storeId={storeId} product={p} />
      ))}
    </div>
  )
}

function ProductCard({ storeId, product }: { storeId: string; product: Product }) {
  const suggested = product.suggested_msrp_cents ?? Math.max(product.base_price_cents * 2, product.base_price_cents + 500)
  const [retailCents, setRetailCents] = useState<number>(suggested)
  const [state, action, pending] = useActionState<ImportState, FormData>(importSupplierProduct, {})
  return (
    <form
      action={action}
      className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40"
    >
      <input type="hidden" name="store_id" value={storeId} />
      <input type="hidden" name="supplier_product_id" value={product.id} />
      <div className="aspect-square bg-panel-elevated">
        {product.primary_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primary_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <p className="text-eyebrow text-muted-foreground">
          {product.brand ?? product.supplier_code}
          {product.category && ` · ${product.category}`}
        </p>
        <p className="text-display mt-1 line-clamp-2 font-bold">{product.name}</p>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Wholesale ${(product.base_price_cents / 100).toFixed(2)}
          {product.inventory_total != null && ` · ${product.inventory_total} in stock`}
        </p>
        <div className="mt-3 grid gap-1.5 text-[10px] text-muted-foreground">
          {product.color_options.length > 0 && (
            <p>
              <span className="uppercase tracking-widest">Colors:</span>{' '}
              {product.color_options.slice(0, 6).join(', ')}
              {product.color_options.length > 6 && '…'}
            </p>
          )}
          {product.size_options.length > 0 && (
            <p>
              <span className="uppercase tracking-widest">Sizes:</span>{' '}
              {product.size_options.join(', ')}
            </p>
          )}
        </div>
        <label className="mt-4 block text-xs">
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
            Your retail price
          </span>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-sm">$</span>
            <input
              name="retail_price_cents"
              type="number"
              min={0}
              step={1}
              value={(retailCents / 100).toFixed(2)}
              onChange={(e) => setRetailCents(Math.round(Number(e.target.value) * 100) || 0)}
              className="w-24 rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
            />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              · margin ${((retailCents - product.base_price_cents) / 100).toFixed(2)}
            </span>
          </div>
        </label>
        <button
          type="submit"
          disabled={pending || Boolean(state.ok)}
          className="text-display mt-3 w-full rounded-[var(--radius-sm)] bg-primary px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Adding…' : state.ok ? 'Added ✓' : 'Add to store'}
        </button>
        {state.error && <p className="mt-2 text-xs text-destructive">{state.error}</p>}
      </div>
    </form>
  )
}
