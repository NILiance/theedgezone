import { SERVICES } from '@/lib/services-data'
import { getServiceContent } from '@/lib/services-rich-content'
import { getServicePricing as getDbServicePricing } from '@/lib/service-pricing'

export interface StripePriceLine {
  unit_amount: number // cents
  currency: 'usd'
  interval: 'month' | 'year' | null // null = one-time
  display_label: string
  tier_label: string
}

/**
 * Map a tier label (e.g. "Monthly" / "Annual" / "One-time") onto the
 * matching `plan_*_cents` column on the DB override row. Case-insensitive
 * to stay forgiving of the labels the rich-content tiers use.
 */
function dbAmountForTier(
  row: { plan_monthly_cents: number | null; plan_annual_cents: number | null; plan_onetime_cents: number | null },
  tierLabel?: string
): { unit_amount: number; interval: 'month' | 'year' | null } | null {
  const t = tierLabel?.toLowerCase() ?? ''
  if (t.includes('month') && row.plan_monthly_cents != null && row.plan_monthly_cents > 0) {
    return { unit_amount: row.plan_monthly_cents, interval: 'month' }
  }
  if ((t.includes('annual') || t.includes('year')) && row.plan_annual_cents != null && row.plan_annual_cents > 0) {
    return { unit_amount: row.plan_annual_cents, interval: 'year' }
  }
  if ((t.includes('one') || t === '') && row.plan_onetime_cents != null && row.plan_onetime_cents > 0) {
    return { unit_amount: row.plan_onetime_cents, interval: null }
  }
  // No tier hint — try plans in the most common order.
  if (row.plan_onetime_cents != null && row.plan_onetime_cents > 0) {
    return { unit_amount: row.plan_onetime_cents, interval: null }
  }
  if (row.plan_monthly_cents != null && row.plan_monthly_cents > 0) {
    return { unit_amount: row.plan_monthly_cents, interval: 'month' }
  }
  if (row.plan_annual_cents != null && row.plan_annual_cents > 0) {
    return { unit_amount: row.plan_annual_cents, interval: 'year' }
  }
  return null
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
 *
 * Source of truth order:
 *   1. service_pricing table (admin override in /admin/pricing) — overrides
 *      the catalog amount/interval whenever the matching plan column is set.
 *   2. services-rich-content RICH_CONTENT[slug].pricing tiers — static
 *      fallback shipped with the catalog.
 *   3. services-data service.price string — last-resort fallback.
 *
 * This async signature lets the checkout API and server action both await
 * the DB lookup so the talent sees the same number on the service page
 * (which already reads the DB) and inside the Stripe checkout panel.
 */
export async function getServicePricing(
  slug: string,
  tierLabel?: string
): Promise<StripePriceLine | null> {
  const service = SERVICES.find((s) => s.id === slug)
  if (!service) return null

  const content = getServiceContent(slug)

  // 1. Try the admin DB override first.
  const dbRow = await getDbServicePricing(slug)
  if (dbRow && dbRow.active !== false) {
    const dbAmount = dbAmountForTier(dbRow, tierLabel)
    if (dbAmount) {
      const resolvedTierLabel =
        tierLabel ??
        (dbAmount.interval === 'month'
          ? 'Monthly'
          : dbAmount.interval === 'year'
            ? 'Annual'
            : 'One-time')
      return {
        unit_amount: dbAmount.unit_amount,
        currency: 'usd',
        interval: dbAmount.interval,
        display_label: dbRow.custom_label
          ? `${service.title} — ${dbRow.custom_label}`
          : `${service.title} — ${resolvedTierLabel}`,
        tier_label: resolvedTierLabel,
      }
    }
  }

  // 2. Fall back to the rich-content tier list.
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

  // 3. Last resort — parse the catalog price string.
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
