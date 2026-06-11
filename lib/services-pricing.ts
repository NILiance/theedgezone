import { SERVICES } from '@/lib/services-data'
import { getServiceContent } from '@/lib/services-rich-content'

export interface StripePriceLine {
  unit_amount: number // cents
  currency: 'usd'
  interval: 'month' | 'year' | null // null = one-time
  display_label: string
  tier_label: string
}

/**
 * Parse a price amount string (e.g. "$29", "$9.99", "$1,200") into cents.
 * Returns null if not parseable.
 */
function parseAmount(str: string | null | undefined): number | null {
  if (!str) return null
  const match = str.match(/\$([\d,]+\.?\d*)/)
  if (!match) return null
  const dollars = parseFloat(match[1]!.replace(/,/g, ''))
  if (Number.isNaN(dollars)) return null
  return Math.round(dollars * 100)
}

function parseIntervalFromPeriod(period: string): 'month' | 'year' | null {
  const p = period.toLowerCase()
  if (p.includes('month')) return 'month'
  if (p.includes('annual') || p.includes('year')) return 'year'
  return null
}

function parseIntervalFromPrice(price: string): 'month' | 'year' | null {
  const p = price.toLowerCase()
  if (p.includes('/mo')) return 'month'
  if (p.includes('/yr')) return 'year'
  return null
}

/**
 * Returns the Stripe pricing for a service, optionally for a specific tier label.
 * Returns null when the service has no parseable price (e.g. "Free / Custom").
 */
export function getServicePricing(slug: string, tierLabel?: string): StripePriceLine | null {
  const service = SERVICES.find((s) => s.id === slug)
  if (!service) return null

  const content = getServiceContent(slug)

  if (content?.pricing && content.pricing.length > 0) {
    const tier = tierLabel
      ? content.pricing.find((t) => t.label.toLowerCase() === tierLabel.toLowerCase())
      : content.pricing[0]
    if (tier) {
      const amount = parseAmount(tier.amount)
      if (amount == null) return null
      return {
        unit_amount: amount,
        currency: 'usd',
        interval: parseIntervalFromPeriod(tier.period),
        display_label: `${service.title} — ${tier.label}`,
        tier_label: tier.label,
      }
    }
  }

  // Fall back to the price string on the service itself
  const amount = parseAmount(service.price)
  if (amount == null) return null
  const interval = parseIntervalFromPrice(service.price)
  return {
    unit_amount: amount,
    currency: 'usd',
    interval,
    display_label: service.title,
    tier_label: interval === 'month' ? 'Monthly' : interval === 'year' ? 'Annual' : 'One-time',
  }
}
