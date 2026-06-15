'use client'

import { useState, useTransition } from 'react'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface Props {
  brandId: string
  /** Pre-formatted price string for paid revisions, e.g. '$10'. */
  paidPriceLabel: string
  /** True when the first revision is free AND this brand has none yet. */
  firstIsFree: boolean
  /** Total revisions already on the brand — surfaced in copy. */
  existingCount: number
}

export function RequestRevisionButton({
  brandId,
  paidPriceLabel,
  firstIsFree,
  existingCount,
}: Props) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [freeSubmitted, setFreeSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const ctaLabel = firstIsFree
    ? 'Request revision — first one free'
    : paidPriceLabel
      ? `Request revision — ${paidPriceLabel}`
      : 'Request revision'

  const submit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/checkout/brand-design-extras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'revision',
            brand_id: brandId,
            notes: notes.trim() || null,
          }),
        })
        const json = (await res.json()) as {
          client_secret?: string
          free?: boolean
          error?: string
        }
        if (!res.ok) {
          setError(json.error ?? 'Failed to start revision request.')
          return
        }
        if (json.free) {
          setFreeSubmitted(true)
          return
        }
        if (json.client_secret) {
          setClientSecret(json.client_secret)
        }
      } catch {
        setError('Failed to start revision request.')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setFreeSubmitted(false)
          setClientSecret(null)
          setError(null)
        }}
        className="text-display rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary"
      >
        {ctaLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[var(--radius)] bg-background shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-display font-bold">Request a revision</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full bg-panel-elevated px-2 py-0.5 text-sm font-bold hover:bg-panel"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-5">
              {!clientSecret && !freeSubmitted && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Tell our designer what to change — color shifts, alternate composition,
                    different lockup, anything. Most revisions ship within 48 hours.
                  </p>
                  {existingCount > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Previous revisions on this brand: {existingCount}.
                    </p>
                  )}
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    maxLength={400}
                    placeholder="E.g. Switch the gold to brighter yellow and try a stacked composition with the initials above the wordmark."
                    className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {notes.length}/400
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {firstIsFree
                        ? 'First revision is free.'
                        : paidPriceLabel
                          ? `Charged at ${paidPriceLabel} once you submit.`
                          : 'Revision price not configured yet — admin can set it under Pricing.'}
                    </span>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={pending}
                      className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
                    >
                      {pending ? '…' : firstIsFree ? 'Submit free revision' : 'Continue to payment'}
                    </button>
                  </div>
                  {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
                </>
              )}

              {freeSubmitted && (
                <div className="space-y-3 text-center py-6">
                  <p className="text-display text-2xl font-black text-success">
                    ✓ Revision requested
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Our designer will work on it and post the revised concept to your studio
                    within 48 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-display mt-3 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
                  >
                    Close
                  </button>
                </div>
              )}

              {clientSecret && stripePromise && (
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={{ clientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
