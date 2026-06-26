'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import {
  updateStoreSettings,
  upsertStoreProduct,
  deleteStoreProduct,
} from '../actions'

interface Store {
  id: string
  name: string
  tagline: string
  description: string
  status: string
  primary_color: string
  secondary_color: string
  hero_image_url: string
  logo_url: string
  contact_email: string
}

interface Variant {
  size?: string
  color?: string
  sku?: string
  price_cents?: number | null
  inventory?: number | null
}

interface Product {
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
  variants: Variant[]
  active: boolean
}

interface Order {
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
}

interface Props {
  store: Store
  products: Product[]
  orders: Order[]
}

export function StoreManagerClient({ store, products, orders }: Props) {
  const [section, setSection] = useState<'products' | 'settings' | 'orders'>('products')
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['products', `Products (${products.length})`],
            ['settings', 'Settings'],
            ['orders', `Orders (${orders.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              section === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'products' && <ProductsTab storeId={store.id} products={products} />}
      {section === 'settings' && <SettingsTab store={store} />}
      {section === 'orders' && <OrdersTab orders={orders} products={products} />}
    </div>
  )
}

function ProductsTab({ storeId, products }: { storeId: string; products: Product[] }) {
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [isPending, startTransition] = useTransition()

  if (editing) {
    return (
      <ProductEditor
        storeId={storeId}
        product={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    )
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this product?')) return
    const fd = new FormData()
    fd.set('product_id', id)
    startTransition(async () => {
      await deleteStoreProduct(fd)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>+ Add product</Button>
      </div>
      {products.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No products yet. Add your first.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40"
            >
              {p.primary_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.primary_image_url}
                  alt={p.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-panel-elevated/40 text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <div className="p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-display font-bold">{p.name}</p>
                  {!p.active && (
                    <span className="text-display rounded-full bg-panel-elevated px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-primary">${(p.price_cents / 100).toFixed(2)}</p>
                {typeof p.inventory === 'number' && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.inventory} in stock
                  </p>
                )}
                <div className="mt-3 flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(p.id)}
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductEditor({
  storeId,
  product,
  onClose,
}: {
  storeId: string
  product: Product | null
  onClose: () => void
}) {
  const [imageUrl, setImageUrl] = useState(product?.primary_image_url ?? '')
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? [])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const addVariant = () =>
    setVariants((v) => [...v, { size: '', color: '', sku: '', price_cents: null, inventory: null }])
  const updateVariant = (i: number, patch: Partial<Variant>) =>
    setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  const removeVariant = (i: number) => setVariants((v) => v.filter((_, idx) => idx !== i))

  const action = (fd: FormData) => {
    fd.set('primary_image_url', imageUrl)
    // Clean variants: drop empties, auto-fill sku from size/color when blank.
    const cleaned = variants
      .filter((v) => (v.size || v.color || v.sku))
      .map((v) => ({
        size: v.size?.trim() || undefined,
        color: v.color?.trim() || undefined,
        sku:
          v.sku?.trim() ||
          [v.size, v.color].filter(Boolean).join('-').toLowerCase().replace(/\s+/g, '-') ||
          undefined,
        price_cents: v.price_cents ? Number(v.price_cents) : null,
        inventory: v.inventory != null && `${v.inventory}` !== '' ? Number(v.inventory) : null,
      }))
    fd.set('variants', JSON.stringify(cleaned))
    setError(null)
    startTransition(async () => {
      const res = await upsertStoreProduct(fd)
      if (res.ok) onClose()
      else setError(res.message ?? 'Save failed')
    })
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="store_id" value={storeId} />
      {product?.id && <input type="hidden" name="product_id" value={product.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Product name</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ''}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="price_cents">Price (cents)</Label>
          <Input
            id="price_cents"
            name="price_cents"
            type="number"
            min={0}
            defaultValue={product?.price_cents ?? 2500}
            required
          />
        </div>
        <div>
          <Label htmlFor="compare_at_cents">Compare-at price (cents)</Label>
          <Input
            id="compare_at_cents"
            name="compare_at_cents"
            type="number"
            min={0}
            defaultValue={product?.compare_at_cents ?? ''}
          />
        </div>
        <div>
          <Label htmlFor="inventory">Inventory (blank = unlimited)</Label>
          <Input
            id="inventory"
            name="inventory"
            type="number"
            min={0}
            defaultValue={product?.inventory ?? ''}
          />
        </div>
        <div>
          <Label htmlFor="cost_cents">Your cost / unit (cents)</Label>
          <Input
            id="cost_cents"
            name="cost_cents"
            type="number"
            min={0}
            defaultValue={product?.cost_cents ?? ''}
            placeholder="e.g. 1200"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Supplier cost — used to compute your payout (sale − cost − fee).
          </p>
        </div>
        <div>
          <Label htmlFor="tags">Tags (comma-sep)</Label>
          <Input
            id="tags"
            name="tags"
            defaultValue={product?.tags?.join(', ') ?? ''}
            placeholder="apparel, limited"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Product image</Label>
          <AssetPicker value={imageUrl} onChange={setImageUrl} accept="image/*" />
        </div>

        {/* Variants (size / color) */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label>Variants (size / color)</Label>
            <Button type="button" size="sm" variant="outline" onClick={addVariant}>
              + Add variant
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Leave empty for a single one-size product. Price override is optional (blank = base
            price). Inventory blank = unlimited.
          </p>
          {variants.length > 0 && (
            <div className="mt-2 space-y-2">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 items-end gap-2 rounded-[var(--radius-sm)] border border-border bg-panel/30 p-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"
                >
                  <Input
                    placeholder="Size (M)"
                    value={v.size ?? ''}
                    onChange={(e) => updateVariant(i, { size: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Color (Black)"
                    value={v.color ?? ''}
                    onChange={(e) => updateVariant(i, { color: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Price ¢ (opt)"
                    type="number"
                    min={0}
                    value={v.price_cents ?? ''}
                    onChange={(e) =>
                      updateVariant(i, { price_cents: e.target.value ? Number(e.target.value) : null })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Stock (opt)"
                    type="number"
                    min={0}
                    value={v.inventory ?? ''}
                    onChange={(e) =>
                      updateVariant(i, { inventory: e.target.value ? Number(e.target.value) : null })
                    }
                    className="h-8 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="text-display rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] font-bold text-destructive"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Active (visible on storefront)</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : product ? 'Save product' : 'Add product'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function SettingsTab({ store }: { store: Store }) {
  const [hero, setHero] = useState(store.hero_image_url)
  const [logo, setLogo] = useState(store.logo_url)
  const [primary, setPrimary] = useState(store.primary_color)
  const [secondary, setSecondary] = useState(store.secondary_color)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const action = (fd: FormData) => {
    setStatus(null)
    fd.set('hero_image_url', hero)
    fd.set('logo_url', logo)
    fd.set('primary_color', primary)
    fd.set('secondary_color', secondary)
    startTransition(async () => {
      const res = await updateStoreSettings(fd)
      setStatus(res.ok ? 'Saved.' : res.message ?? 'Save failed')
    })
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="store_id" value={store.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Store name</Label>
          <Input id="name" name="name" defaultValue={store.name} required />
        </div>
        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" name="tagline" defaultValue={store.tagline} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={store.description}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Hero image</Label>
          <AssetPicker value={hero} onChange={setHero} accept="image/*" />
        </div>
        <div className="sm:col-span-2">
          <Label>Logo</Label>
          <AssetPicker value={logo} onChange={setLogo} accept="image/*" />
        </div>
        <div>
          <Label>Primary color</Label>
          <Input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-10 w-20 p-1"
          />
        </div>
        <div>
          <Label>Secondary color</Label>
          <Input
            type="color"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            className="h-10 w-20 p-1"
          />
        </div>
        <div>
          <Label htmlFor="contact_email">Contact email</Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={store.contact_email}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={store.status}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="open">Open (live)</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save settings'}
        </Button>
        {status && (
          <p className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}>
            {status}
          </p>
        )}
      </div>
    </form>
  )
}

function OrdersTab({ orders, products }: { orders: Order[]; products: Product[] }) {
  const productsById = new Map(products.map((p) => [p.id, p]))
  if (orders.length === 0) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
        No orders yet.
      </p>
    )
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
      <table className="w-full text-sm">
        <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Product</th>
            <th className="px-3 py-2 text-left">Buyer</th>
            <th className="px-3 py-2 text-right">Amount</th>
            <th className="px-3 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const p = o.product_id ? productsById.get(o.product_id) : null
            return (
              <tr key={o.id} className="border-t border-border">
                <td className="px-3 py-2 text-xs">
                  {new Date(o.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-xs">
                  {p?.name ?? '—'}
                  {(o.variant_label || o.quantity > 1) && (
                    <span className="text-muted-foreground">
                      {o.variant_label ? ` · ${o.variant_label}` : ''}
                      {o.quantity > 1 ? ` · ×${o.quantity}` : ''}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  {o.buyer_name ?? '—'}
                  {o.buyer_email && (
                    <p className="text-muted-foreground">{o.buyer_email}</p>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-bold text-primary">
                  ${(o.amount_cents / 100).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      o.status === 'paid' || o.status === 'fulfilled' || o.status === 'shipped'
                        ? 'bg-success/20 text-success'
                        : o.status === 'cancelled' || o.status === 'refunded'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-panel-elevated text-muted-foreground'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
