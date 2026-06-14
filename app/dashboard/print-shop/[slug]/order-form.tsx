'use client'

import { useActionState, useMemo, useState } from 'react'
import { createPrintOrder, type PrintOrderState } from '../actions'

type Variant = { label: string; price_cents: number }
type Option = { key: string; label: string; values: string[] }

export function OrderForm({
  productId,
  productName,
  basePriceCents,
  variants,
  options,
}: {
  productId: string
  productName: string
  basePriceCents: number
  variants: Variant[]
  options: Option[]
}) {
  const [state, action, pending] = useActionState<PrintOrderState, FormData>(createPrintOrder, {})
  const [variant, setVariant] = useState<string>(variants[0]?.label ?? '')
  const [quantity, setQuantity] = useState<number>(1)

  const unitPrice = useMemo(() => {
    const v = variants.find((x) => x.label === variant)
    return v ? v.price_cents : basePriceCents
  }, [variant, variants, basePriceCents])
  const total = unitPrice * Math.max(1, quantity)

  if (state.checkoutUrl) {
    if (typeof window !== 'undefined') {
      window.location.href = state.checkoutUrl
    }
    return (
      <p className="rounded-[var(--radius)] border border-border bg-panel/40 p-6 text-sm">
        Redirecting to checkout…
      </p>
    )
  }

  return (
    <form action={action} className="space-y-5 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <input type="hidden" name="product_id" value={productId} />
      <p className="text-eyebrow text-primary">Order {productName}</p>

      {variants.length > 0 && (
        <label className="block text-sm">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Variant</span>
          <select
            name="variant_label"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
          >
            {variants.map((v) => (
              <option key={v.label} value={v.label}>
                {v.label} — ${(v.price_cents / 100).toFixed(0)}
              </option>
            ))}
          </select>
        </label>
      )}

      {options.map((opt) => (
        <label key={opt.key} className="block text-sm">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{opt.label}</span>
          <select
            name={`opt_${opt.key}`}
            defaultValue={opt.values[0] ?? ''}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
          >
            {opt.values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ))}

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Quantity</span>
        <input
          name="quantity"
          type="number"
          min={1}
          max={50}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Artwork URLs (one per line)
        </span>
        <textarea
          name="artwork_urls"
          rows={3}
          placeholder="https://… (PDF, PNG, AI, EPS)"
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-xs uppercase tracking-widest text-muted-foreground">Ship to</legend>
        <input
          name="ship_to_name"
          required
          placeholder="Full name"
          className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="ship_to_phone"
          placeholder="Phone"
          className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="ship_to_street"
          required
          placeholder="Street address"
          className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-[1fr_120px_120px] gap-2">
          <input
            name="ship_to_city"
            required
            placeholder="City"
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            name="ship_to_state"
            required
            placeholder="State"
            maxLength={2}
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm uppercase"
          />
          <input
            name="ship_to_postal"
            required
            placeholder="ZIP"
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Notes</span>
        <textarea
          name="notes"
          rows={2}
          placeholder="Anything we should know — color match, delivery date, etc."
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-baseline justify-between rounded-[var(--radius-sm)] border border-border bg-background/40 px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Total</p>
        <p className="text-display text-2xl font-black text-primary">
          ${(total / 100).toFixed(2)}
        </p>
      </div>

      {state.error && (
        <p className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="text-display w-full rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Setting up checkout…' : 'Continue to checkout →'}
      </button>
    </form>
  )
}
