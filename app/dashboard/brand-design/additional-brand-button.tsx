'use client'

import { useState, useTransition } from 'react'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface Props {
  /** Pre-formatted price label, e.g. '$15'. Empty string when unconfigured. */
  priceLabel: string
}

export function AdditionalBrandButton({ priceLabel }: Props) {
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
          body: JSON.stringify({ kind: 'additional' }),
        })
        const json = (await res.json()) as { client_secret?: string; error?: string }
        if (!res.ok || !json.client_secret) {
          setError(json.error ?? 'Failed to start checkout.')
          return
        }
        setClientSecret(json.client_secret)
        setOpen(true)
      } catch {
        setError('Failed to start checkout.')
      }
    })
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={begin}
          disabled={pending || !priceLabel}
          title={priceLabel ? undefined : 'Additional brand price not configured'}
          className="text-display rounded-[var(--radius-sm)] border border-accent bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent disabled:opacity-50"
        >
          {pending ? 'Loading…' : `+ Additional logo${priceLabel ? ` — ${priceLabel}` : ''}`}
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
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
