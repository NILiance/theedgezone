'use client'

import { useMemo, useState, useTransition } from 'react'

interface Variant {
  size?: string
  color?: string
  sku?: string
  price_cents?: number | null
  inventory?: number | null
}

interface Props {
  storeId: string
  productId: string
  basePriceCents: number
  currency: string
  variants: Variant[]
  buttonColor: string
  buttonText: string
}

function variantLabel(v: Variant): string {
  return [v.size, v.color].filter(Boolean).join(' / ') || v.sku || 'Option'
}

export function StoreCheckoutButton({
  storeId,
  productId,
  basePriceCents,
  currency,
  variants,
  buttonColor,
  buttonText,
}: Props) {
  const hasVariants = variants.length > 0
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [variantSku, setVariantSku] = useState<string>(
    hasVariants ? (variants[0]!.sku ?? '') : ''
  )
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedVariant = useMemo(
    () => (hasVariants ? variants.find((v) => v.sku === variantSku) ?? variants[0]! : null),
    [hasVariants, variants, variantSku]
  )
  const unitPrice = selectedVariant?.price_cents ?? basePriceCents
  const soldOut =
    selectedVariant && typeof selectedVariant.inventory === 'number' && selectedVariant.inventory <= 0
  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
      cents / 100
    )

  const submit = () => {
    if (!email) {
      setError('Email required.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/store-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: storeId,
            product_id: productId,
            buyer_email: email,
            buyer_name: name || undefined,
            variant_sku: hasVariants ? variantSku : undefined,
            quantity: qty,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Checkout failed')
          return
        }
        const data = await res.json()
        if (data.url) window.location.href = data.url
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed')
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md px-4 py-2 text-xs font-bold uppercase tracking-widest"
        style={{ background: buttonColor, color: buttonText }}
      >
        Buy now
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {hasVariants && (
        <select
          value={variantSku}
          onChange={(e) => setVariantSku(e.target.value)}
          className="w-full rounded-md border border-neutral-300 p-2 text-xs"
        >
          {variants.map((v) => (
            <option key={v.sku ?? variantLabel(v)} value={v.sku ?? ''}>
              {variantLabel(v)}
              {typeof v.price_cents === 'number' && v.price_cents !== basePriceCents
                ? ` — ${fmt(v.price_cents)}`
                : ''}
              {typeof v.inventory === 'number' && v.inventory <= 0 ? ' (sold out)' : ''}
            </option>
          ))}
        </select>
      )}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Qty
        </label>
        <input
          type="number"
          min={1}
          max={99}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          className="w-16 rounded-md border border-neutral-300 p-2 text-xs"
        />
        <span className="ml-auto text-sm font-black" style={{ color: buttonColor }}>
          {fmt(unitPrice * qty)}
        </span>
      </div>
      <input
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-neutral-300 p-2 text-xs"
      />
      <input
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-neutral-300 p-2 text-xs"
      />
      {error && (
        <p className="text-[10px]" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !email || Boolean(soldOut)}
        className="w-full rounded-md px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-60"
        style={{ background: buttonColor, color: buttonText }}
      >
        {soldOut ? 'Sold out' : isPending ? 'Loading…' : 'Continue to checkout'}
      </button>
    </div>
  )
}
