'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/actions/checkout'
import type { PricingTier } from '@/lib/services-rich-content'

interface ServicePricingCardProps {
  slug: string
  tiers: PricingTier[]
  ctaLabel?: string
  fallbackHref?: string
  fallbackPrice?: string
  /**
   * When true, the user is signed in and we route through Stripe checkout.
   * When false, the CTA points at /sign-up so unauthed users register first.
   */
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

  // No paid tiers — Free / Custom service. Send to sign-up.
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

      {/* Tier picker */}
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
        <form action={createCheckoutSession} className="mt-6">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="tier" value={active.label} />
          <Button type="submit" size="lg" className="w-full">
            {ctaLabel}
          </Button>
        </form>
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
