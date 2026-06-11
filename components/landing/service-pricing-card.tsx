'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { PricingTier } from '@/lib/services-rich-content'

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

let stripePromise: Promise<StripeJS | null> | null = null
function getStripePromise() {
  if (!PUBLISHABLE_KEY) return null
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY)
  return stripePromise
}

interface ServicePricingCardProps {
  slug: string
  tiers: PricingTier[]
  ctaLabel?: string
  fallbackHref?: string
  fallbackPrice?: string
  authed?: boolean
}

export function ServicePricingCard({
  slug,
  tiers,
  ctaLabel = 'GET STARTED →',
  fallbackHref = '/sign-up',
  fallbackPrice,
  authed = false,
}: ServicePricingCardProps) {
  const [selected, setSelected] = useState(0)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        tier: tiers[selected]?.label,
      }),
    })
    const data = (await res.json()) as { client_secret?: string; error?: string }
    if (!res.ok || !data.client_secret) {
      throw new Error(data.error ?? `HTTP ${res.status}`)
    }
    return data.client_secret
  }, [slug, tiers, selected])

  async function startCheckout() {
    setPending(true)
    setError(null)
    try {
      const cs = await fetchClientSecret()
      setClientSecret(cs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
    } finally {
      setPending(false)
    }
  }

  // ── Inline embedded checkout ────────────────────────────────────────────
  if (clientSecret) {
    const stripePromise = getStripePromise()
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel p-2 shadow-elevated">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-eyebrow text-muted-foreground">Secure checkout</p>
          <button
            type="button"
            onClick={() => {
              setClientSecret(null)
              setError(null)
            }}
            className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
        </div>
        {stripePromise ? (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret: async () => clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        ) : (
          <p className="p-6 text-center text-sm text-destructive">
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing.
          </p>
        )}
      </div>
    )
  }

  // ── Free / Custom — no Stripe price, just send to sign-up ──────────────
  if (!tiers.length) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel p-8 text-center shadow-elevated">
        <p className="text-display text-3xl font-black text-primary">
          {fallbackPrice ?? 'Free / Custom'}
        </p>
        <Link href={fallbackHref} className="mt-6 block">
          <Button size="lg" className="w-full">
            {ctaLabel}
          </Button>
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">Secure payment via Stripe</p>
      </div>
    )
  }

  const active = tiers[selected]!

  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel p-8 shadow-elevated">
      <p className="text-eyebrow text-center text-primary">Choose Your Plan</p>

      {tiers.length > 1 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {tiers.map((tier, i) => (
            <button
              key={tier.label}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                'rounded-[var(--radius-sm)] border p-4 text-left transition-colors',
                selected === i
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background/40 hover:border-primary/50'
              )}
            >
              <p className="text-display text-xs font-bold uppercase tracking-widest text-foreground/70">
                {tier.label}
              </p>
              <p className="text-display mt-2 text-2xl font-black text-foreground">
                {tier.amount}
              </p>
              <p className="text-xs text-muted-foreground">{tier.period}</p>
              {tier.savings && (
                <p className="mt-1 text-xs font-bold text-success">{tier.savings}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {tiers.length === 1 && (
        <div className="mt-4 text-center">
          <p className="text-display text-4xl font-black text-foreground">{active.amount}</p>
          <p className="mt-1 text-sm text-muted-foreground">{active.period}</p>
          {active.savings && (
            <p className="mt-1 text-sm font-bold text-success">{active.savings}</p>
          )}
        </div>
      )}

      {authed ? (
        <>
          <Button
            type="button"
            size="lg"
            className="mt-6 w-full"
            disabled={pending}
            onClick={startCheckout}
          >
            {pending ? 'Loading…' : ctaLabel}
          </Button>
          {error && (
            <p className="mt-3 text-center text-xs text-destructive">{error}</p>
          )}
        </>
      ) : (
        <Link href={`/sign-up?next=/services/${slug}`} className="mt-6 block">
          <Button size="lg" className="w-full">
            {ctaLabel}
          </Button>
        </Link>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Secure payment via Stripe
      </p>
    </div>
  )
}
