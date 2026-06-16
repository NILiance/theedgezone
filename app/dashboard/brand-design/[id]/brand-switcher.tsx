'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface Brand {
  id: string
  brand_name: string | null
  final_logo_url: string | null
  status: string | null
}

/**
 * Horizontal "Your logos" row matching the legacy WP plugin's brand
 * switcher. Each tile links to that brand's studio; the active brand
 * gets a gold ring + checkmark. The trailing "+" tile launches an
 * embedded Stripe checkout for the additional-brand purchase.
 *
 * On successful payment the talent lands on
 * /dashboard/brand-design?checkout=success&session_id=... where
 * fulfillCheckoutSession provisions the new brand_designs row inline.
 */
export function BrandSwitcher({
  brands,
  activeId,
  priceLabel,
}: {
  brands: Brand[]
  activeId: string
  priceLabel: string
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const beginPurchase = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/checkout/brand-design-extras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'additional' }),
        })
        const json = (await res.json()) as { client_secret?: string; error?: string }
        if (!res.ok || !json.client_secret) {
          setError(json.error ?? 'Could not start checkout.')
          return
        }
        setClientSecret(json.client_secret)
        setOpen(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Network error')
      }
    })
  }

  return (
    <>
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-3">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="text-display shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your logos:
          </span>
          {brands.map((b) => {
            const isActive = b.id === activeId
            return (
              <Link
                key={b.id}
                href={`/dashboard/brand-design/${b.id}`}
                title={b.brand_name ?? 'Untitled brand'}
                className={`group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white transition-all ${
                  isActive
                    ? 'ring-2 ring-primary shadow-[0_0_0_3px_rgba(0,0,0,0.4)]'
                    : 'ring-1 ring-border hover:ring-primary/40'
                }`}
              >
                {b.final_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.final_logo_url}
                    alt={b.brand_name ?? 'Brand'}
                    className="max-h-full max-w-full object-contain p-1"
                  />
                ) : (
                  <span className="text-display text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                    {b.brand_name?.slice(0, 2)?.toUpperCase() ?? '—'}
                  </span>
                )}
                {isActive && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 -translate-y-1 translate-x-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
                    ✓
                  </span>
                )}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={beginPurchase}
            disabled={pending || !stripePromise || !priceLabel}
            title={
              priceLabel
                ? `Add another brand · ${priceLabel}`
                : 'Additional brand price not configured'
            }
            className="text-display flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-background text-xl text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {pending ? '…' : '+'}
          </button>
          {priceLabel && (
            <span className="text-display shrink-0 text-[10px] font-bold uppercase tracking-widest text-accent">
              +{priceLabel}
            </span>
          )}
        </div>
        {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
      </div>

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
              <p className="text-display font-bold">Additional brand design</p>
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
    </>
  )
}
