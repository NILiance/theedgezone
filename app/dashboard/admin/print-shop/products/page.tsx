import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { upsertPrintProduct, deletePrintProduct } from '../product-actions'

export const metadata = { title: 'Print Products' }

const CATEGORIES = [
  'banner',
  'business_card',
  'flyer',
  'poster',
  'sticker',
  'apparel',
  'signage',
  'other',
]

interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  cover_image_url: string | null
  base_price_cents: number
  lead_time_days: number
  active: boolean
  position: number
}

const input =
  'w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'
const label =
  'text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground'

export default async function AdminPrintProductsPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data } = await supabase
    .from('print_products')
    .select(
      'id, slug, name, description, category, cover_image_url, base_price_cents, lead_time_days, active, position'
    )
    .order('position', { ascending: true })
    .order('name', { ascending: true })
  const products = (data ?? []) as Product[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Print products</p>
          <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Manage products</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and edit the products shown in the Print Shop catalog — name, price, photo,
            category and ordering.
          </p>
        </div>
        <Link
          href="/dashboard/admin/print-shop"
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
        >
          Orders →
        </Link>
      </div>

      {/* New product */}
      <details className="rounded-[var(--radius)] border border-primary/40 bg-panel/40 p-4" open>
        <summary className="text-display cursor-pointer text-sm font-bold text-primary">
          + New product
        </summary>
        <ProductForm />
      </details>

      {/* Existing */}
      <div className="space-y-3">
        {products.map((p) => (
          <details key={p.id} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-panel-elevated">
                  {p.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="text-display block truncate font-bold">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    ${(p.base_price_cents / 100).toFixed(2)} · {p.category.replace('_', ' ')}
                  </span>
                </span>
              </span>
              <span
                className={`text-display shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                  p.active ? 'bg-success/20 text-success' : 'bg-panel-elevated text-muted-foreground'
                }`}
              >
                {p.active ? 'Active' : 'Hidden'}
              </span>
            </summary>
            <ProductForm product={p} />
          </details>
        ))}
        {products.length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No products yet — add one above.
          </p>
        )}
      </div>
    </div>
  )
}

function ProductForm({ product }: { product?: Product }) {
  const p = product
  return (
    <form action={upsertPrintProduct} className="mt-4 grid gap-3">
      {p && <input type="hidden" name="id" value={p.id} />}
      {p?.cover_image_url && (
        <input type="hidden" name="cover_image_url" value={p.cover_image_url} />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Name</span>
          <input name="name" defaultValue={p?.name ?? ''} required className={`mt-1 ${input}`} />
        </label>
        <label className="block">
          <span className={label}>Slug (optional)</span>
          <input name="slug" defaultValue={p?.slug ?? ''} placeholder="auto from name" className={`mt-1 ${input}`} />
        </label>
      </div>
      <label className="block">
        <span className={label}>Description</span>
        <textarea name="description" defaultValue={p?.description ?? ''} rows={2} className={`mt-1 ${input}`} />
      </label>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block">
          <span className={label}>Category</span>
          <select name="category" defaultValue={p?.category ?? 'apparel'} className={`mt-1 ${input}`}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Base price ($)</span>
          <input
            name="base_price"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={p ? (p.base_price_cents / 100).toFixed(2) : ''}
            required
            className={`mt-1 ${input}`}
          />
        </label>
        <label className="block">
          <span className={label}>Lead time (days)</span>
          <input name="lead_time_days" type="number" min="0" defaultValue={p?.lead_time_days ?? 7} className={`mt-1 ${input}`} />
        </label>
        <label className="block">
          <span className={label}>Sort position</span>
          <input name="position" type="number" defaultValue={p?.position ?? 0} className={`mt-1 ${input}`} />
        </label>
      </div>
      <label className="block">
        <span className={label}>Cover image {p?.cover_image_url ? '(replace)' : ''}</span>
        <input
          type="file"
          name="cover_image"
          accept="image/png,image/jpeg,image/webp"
          className="mt-1 block w-full rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-3 py-2 text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-[var(--radius-sm)] file:border file:border-border file:bg-panel-elevated file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-foreground hover:file:bg-primary hover:file:text-primary-foreground"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="active" defaultChecked={p ? p.active : true} className="h-4 w-4" />
          Visible in catalog
        </label>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            {p ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </div>
      {p && (
        <div className="border-t border-border pt-3">
          <button
            type="submit"
            formAction={deletePrintProduct}
            formNoValidate
            className="text-display rounded-[var(--radius-sm)] border border-destructive/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10"
          >
            Delete product
          </button>
        </div>
      )}
    </form>
  )
}
