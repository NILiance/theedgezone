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
}

export const getAllServicePricing = cache(async (): Promise<Map<string, ServicePriceRow>> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('service_pricing')
    .select('service_slug, plan_monthly_cents, plan_annual_cents, plan_onetime_cents, custom_label, active')
  const map = new Map<string, ServicePriceRow>()
  for (const row of data ?? []) {
    map.set(row.service_slug, row as ServicePriceRow)
  }
  return map
})

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
