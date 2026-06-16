/**
 * DB-overlayed service pricing. Falls back to the catalog's display
 * string when no row exists. Cached per request via React.cache so the
 * service catalog page and the PDP can both read it without redundant
 * round trips.
 */
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface ServicePriceRow {
  service_slug: string
  plan_monthly_cents: number | null
  plan_annual_cents: number | null
  plan_onetime_cents: number | null
  custom_label: string | null
  active: boolean
  extras: Record<string, unknown>
}

/**
 * Brand-design-specific extras stored under service_pricing.extras for the
 * `personal-brand-design` row. Read via getBrandDesignExtras().
 *
 * additional_concepts_price_cents + max_free_concepts drive the talent's
 * concept-pack gating: after max_free_concepts have been generated across
 * all rounds, "+10 more" charges additional_concepts_price_cents per pack
 * (10 concepts).
 */
export interface BrandDesignExtras {
  revision_price_cents: number | null
  first_revision_free: boolean
  additional_brand_price_cents: number | null
  additional_concepts_price_cents: number | null
  max_free_concepts: number
}

export const getAllServicePricing = cache(async (): Promise<Map<string, ServicePriceRow>> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('service_pricing')
    .select('service_slug, plan_monthly_cents, plan_annual_cents, plan_onetime_cents, custom_label, active, extras')
  const map = new Map<string, ServicePriceRow>()
  for (const row of data ?? []) {
    map.set(row.service_slug, {
      ...row,
      extras: (row.extras ?? {}) as Record<string, unknown>,
    } as ServicePriceRow)
  }
  return map
})

/**
 * Read brand-design pricing extras from the persisted row. Falls back to
 * conservative defaults when no row exists yet so checkout always has
 * sane numbers.
 */
export async function getBrandDesignExtras(): Promise<BrandDesignExtras> {
  const all = await getAllServicePricing()
  const row = all.get('personal-brand-design')
  const e = (row?.extras ?? {}) as Record<string, unknown>
  return {
    revision_price_cents:
      typeof e.revision_price_cents === 'number' ? e.revision_price_cents : null,
    first_revision_free:
      typeof e.first_revision_free === 'boolean' ? e.first_revision_free : true,
    additional_brand_price_cents:
      typeof e.additional_brand_price_cents === 'number'
        ? e.additional_brand_price_cents
        : null,
    additional_concepts_price_cents:
      typeof e.additional_concepts_price_cents === 'number'
        ? e.additional_concepts_price_cents
        : null,
    max_free_concepts:
      typeof e.max_free_concepts === 'number' && e.max_free_concepts > 0
        ? e.max_free_concepts
        : 20,
  }
}

export const getServicePricing = cache(async (slug: string): Promise<ServicePriceRow | null> => {
  const all = await getAllServicePricing()
  return all.get(slug) ?? null
})

/**
 * Render a display label for a pricing row. Falls back to a sensible
 * default if no plans are set — matches the legacy "price" string column.
 */
export function pricingLabel(row: ServicePriceRow | null, fallback?: string): string {
  if (!row) return fallback ?? 'Custom'
  if (row.custom_label) return row.custom_label
  if (row.plan_monthly_cents != null && row.plan_monthly_cents > 0) {
    return `$${(row.plan_monthly_cents / 100).toFixed(0)}/mo`
  }
  if (row.plan_annual_cents != null && row.plan_annual_cents > 0) {
    return `$${(row.plan_annual_cents / 100).toFixed(0)}/yr`
  }
  if (row.plan_onetime_cents != null && row.plan_onetime_cents > 0) {
    return `$${(row.plan_onetime_cents / 100).toFixed(0)}`
  }
  return fallback ?? 'Custom'
}
