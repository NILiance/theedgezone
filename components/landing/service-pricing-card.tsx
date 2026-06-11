'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { PricingTier } from '@/lib/services-rich-content'

interface ServicePricingCardProps {
  tiers: PricingTier[]
  ctaLabel?: string
  ctaHref?: string
  fallbackPrice?: string
}

export function ServicePricingCard({
  tiers,
  ctaLabel = 'GET STARTED →',
  ctaHref = '/sign-up',
  fallbackPrice,
}: ServicePricingCardProps) {
  const [selected, setSelected] = useState(0)

  if (!tiers.length) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel p-8 text-center shadow-elevated">
        <p className="text-display text-3xl font-black text-primary">
          {fallbackPrice ?? 'Free / Custom'}
        </p>
        <Link href={ctaHref} className="mt-6 block">
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
          <p className="text-display text-4xl font-black text-foreground">
            {active.amount}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{active.period}</p>
          {active.savings && (
            <p className="mt-1 text-sm font-bold text-success">{active.savings}</p>
          )}
        </div>
      )}

      <Link href={ctaHref} className="mt-6 block">
        <Button size="lg" className="w-full">
          {ctaLabel}
        </Button>
      </Link>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Secure payment via Stripe
      </p>
    </div>
  )
}
