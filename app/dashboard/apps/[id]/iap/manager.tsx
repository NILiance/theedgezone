'use client'

import { useActionState, useState } from 'react'
import { createIap, updateIap, deleteIap, type IapState } from './actions'

type Product = {
  id: string
  product_id: string
  display_name: string
  description: string | null
  price_usd: number
  kind: string
  status: string
  apple_product_id: string | null
  google_product_id: string | null
}

export function IapManager({ appId, products }: { appId: string; products: Product[] }) {
  return (
    <div className="space-y-6">
      <NewIapForm appId={appId} />
      <div className="space-y-3">
        {products.map((p) => (
          <IapRow key={p.id} appId={appId} product={p} />
        ))}
        {products.length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No IAP products yet.
          </p>
        )}
      </div>
    </div>
  )
}

function NewIapForm({ appId }: { appId: string }) {
  const [state, action, pending] = useActionState<IapState, FormData>(createIap, {})
  return (
    <form action={action} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <input type="hidden" name="app_id" value={appId} />
      <p className="text-eyebrow mb-3 text-primary">+ Add product</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="product_id"
          required
          placeholder="Product ID (sku.001)"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm font-mono"
        />
        <input
          name="display_name"
          required
          placeholder="Display name"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="price_usd"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Price USD"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <select
          name="kind"
          defaultValue="consumable"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="consumable">Consumable</option>
          <option value="non_consumable">Non-consumable</option>
          <option value="subscription">Subscription</option>
        </select>
        <textarea
          name="description"
          rows={2}
          placeholder="Description"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2 lg:col-span-4"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add product'}
        </button>
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
        {state.ok && <p className="text-xs text-success">Added.</p>}
      </div>
    </form>
  )
}

function IapRow({ appId, product }: { appId: string; product: Product }) {
  const [editing, setEditing] = useState(false)
  const [upState, upAction, upPending] = useActionState<IapState, FormData>(updateIap, {})
  const [delState, delAction, delPending] = useActionState<IapState, FormData>(deleteIap, {})
  const tone =
    product.status === 'active'
      ? 'bg-success/20 text-success'
      : product.status === 'pending_review'
      ? 'bg-accent/20 text-accent'
      : 'bg-panel-elevated text-muted-foreground'
  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <div className="flex-1 min-w-0">
          <p className="text-display font-bold">{product.display_name}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{product.product_id}</p>
          {product.description && (
            <p className="mt-1 text-xs text-muted-foreground">{product.description}</p>
          )}
        </div>
        <div className="text-right text-xs">
          <p className="text-display text-base font-black text-primary">${product.price_usd.toFixed(2)}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{product.kind}</p>
        </div>
        <span
          className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
        >
          {product.status.replace('_', ' ')}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1 text-xs font-bold uppercase tracking-widest"
        >
          Edit
        </button>
        <form action={delAction}>
          <input type="hidden" name="app_id" value={appId} />
          <input type="hidden" name="id" value={product.id} />
          <button
            type="submit"
            disabled={delPending}
            className="text-display rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-destructive disabled:opacity-50"
          >
            {delPending ? '…' : 'Delete'}
          </button>
        </form>
        {delState.error && <p className="text-xs text-destructive">{delState.error}</p>}
      </div>
    )
  }
  return (
    <form action={upAction} className="rounded-[var(--radius)] border border-primary/40 bg-panel/40 p-4">
      <input type="hidden" name="app_id" value={appId} />
      <input type="hidden" name="id" value={product.id} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="display_name"
          required
          defaultValue={product.display_name}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2"
        />
        <input
          name="price_usd"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={product.price_usd}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <select
          name="status"
          defaultValue={product.status}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="pending_review">Pending review</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
        <input
          name="apple_product_id"
          placeholder="Apple Product ID (from App Store Connect)"
          defaultValue={product.apple_product_id ?? ''}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2"
        />
        <input
          name="google_product_id"
          placeholder="Google Product ID (from Play Console)"
          defaultValue={product.google_product_id ?? ''}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2"
        />
        <textarea
          name="description"
          rows={2}
          defaultValue={product.description ?? ''}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2 lg:col-span-4"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={upPending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {upPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
        >
          Cancel
        </button>
        {upState.error && <p className="text-xs text-destructive">{upState.error}</p>}
        {upState.ok && <p className="text-xs text-success">Saved.</p>}
      </div>
    </form>
  )
}
