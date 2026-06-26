'use client'

import { useState, useTransition } from 'react'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

/**
 * "Buy 10 more concepts" — opens an embedded Stripe checkout for the
 * concept_pack extra. On success Stripe redirects back to the concepts
 * tab where fulfillCheckoutSession bumps paid_concepts_total, so the
 * talent's remaining count goes up without leaving the studio.
 */
export function ConceptPackButton({
  brandId,
  priceLabel,
  outOfConcepts,
}: {
  brandId: string
  /** Pre-formatted price, e.g. '$25'. Empty when unconfigured. */
  priceLabel: string
  /** When true the talent has hit the wall — render a louder primary CTA. */
  outOfConcepts?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const begin = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/checkout/brand-design-extras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'concept_pack', brand_id: brandId }),
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

  const cls = outOfConcepts
    ? 'border border-primary bg-primary text-primary-foreground'
    : 'border border-accent bg-accent/10 text-accent'

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={begin}
          disabled={pending || !priceLabel || !stripePromise}
          title={priceLabel ? undefined : 'Concept pack price not configured'}
          className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest disabled:opacity-50 ${cls}`}
        >
          {pending
            ? 'Loading…'
            : `+ Buy 10 concepts${priceLabel ? ` — ${priceLabel}` : ''}`}
        </button>
        {error && <p className="text-[10px] text-destructive">{error}</p>}
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
              <p className="text-display font-bold">10 more concepts</p>
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
