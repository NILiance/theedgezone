'use client'

import { useState, useTransition } from 'react'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

export interface OrderTier {
  qty: number
  price_cents: number
  label: string
}
export interface OrderableCard {
  id: string
  url: string
  style?: string | null
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * "Order Printed Cards" panel — pick one of the talent's generated cards
 * and a quantity tier, then pay via embedded Stripe checkout. The webhook
 * marks the order paid + emails a proof. Mirrors the legacy WP order flow.
 */
export function TradingCardOrderPanel({
  brandId,
  tiers,
  cards,
  orderSuccess,
}: {
  brandId: string
  tiers: OrderTier[]
  cards: OrderableCard[]
  orderSuccess?: boolean
}) {
  const [cardId, setCardId] = useState<string>(cards[0]?.id ?? '')
  const [qty, setQty] = useState<number>(tiers[0]?.qty ?? 25)
  const [notes, setNotes] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const tier = tiers.find((t) => t.qty === qty) ?? tiers[0]

  const begin = () => {
    setError(null)
    if (!cardId) {
      setError('Pick a card to print.')
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/checkout/trading-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand_id: brandId, addon_id: cardId, qty, notes }),
        })
        const json = (await res.json()) as { client_secret?: string; error?: string }
        if (!res.ok || !json.client_secret) {
          setError(json.error ?? 'Could not start checkout.')
          return
        }
        setClientSecret(json.client_secret)
        setOpen(true)
      } catch {
        setError('Could not start checkout.')
      }
    })
  }

  return (
    <section className="mx-auto mt-8 max-w-2xl rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <h3 className="text-display text-lg font-black text-primary">📦 Order Printed Cards</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Premium 2.5&quot; × 3.5&quot; trading cards on thick glossy card stock. We email a proof
        before printing; ships in 5–7 business days.
      </p>

      {orderSuccess && (
        <div className="mt-3 rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          ✓ Order placed! Check your email for confirmation — we&rsquo;ll send a proof before
          printing.
        </div>
      )}

      {cards.length === 0 ? (
        <p className="mt-4 rounded-[var(--radius-sm)] border border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
          Generate a card above first — then you can order printed copies here.
        </p>
      ) : (
        <>
          {/* Card picker */}
          <p className="text-display mt-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Choose a card
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {cards.map((c) => {
              const selected = c.id === cardId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCardId(c.id)}
                  className={`overflow-hidden rounded-[var(--radius-sm)] border-2 bg-white transition-colors ${
                    selected ? 'border-primary' : 'border-border hover:border-muted-foreground'
                  }`}
                  aria-pressed={selected}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.url} alt="Trading card" className="h-32 w-auto object-contain" />
                </button>
              )
            })}
          </div>

          {/* Quantity tiers */}
          <p className="text-display mt-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Quantity
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {tiers.map((t) => {
              const selected = t.qty === qty
              return (
                <label
                  key={t.qty}
                  className={`flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] border px-4 py-3 transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-muted-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tc-tier"
                      value={t.qty}
                      checked={selected}
                      onChange={() => setQty(t.qty)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-display text-sm font-bold">{t.label}</span>
                  </span>
                  <span className="text-right">
                    <span className="text-display block text-sm font-bold text-success">
                      {usd(t.price_cents)}
                    </span>
                    {t.qty > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {usd(Math.round(t.price_cents / t.qty))}/card
                      </span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>

          {/* Notes */}
          <label className="mt-4 block">
            <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Special instructions (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything we should know — deadline, packaging, etc."
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Your shipping address is collected securely at checkout.
          </p>

          <button
            type="button"
            onClick={begin}
            disabled={pending || !cardId || !stripePromise}
            className="text-display mt-3 w-full rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending
              ? 'Starting checkout…'
              : `💳 Order ${tier?.label ?? 'Cards'}${tier ? ` — ${usd(tier.price_cents)}` : ''}`}
          </button>
          {!stripePromise && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Checkout is unavailable — payment keys aren&rsquo;t configured yet.
            </p>
          )}
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </>
      )}

      {open && clientSecret && stripePromise && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[var(--radius)] bg-background shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-display font-bold">Order printed cards</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full bg-panel-elevated px-2 py-0.5 text-sm font-bold hover:bg-panel"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
