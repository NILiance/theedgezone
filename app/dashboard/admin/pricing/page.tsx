import { requireAdmin } from '@/lib/auth'
import { SERVICES, CATEGORIES } from '@/lib/services-data'
import { getAllServicePricing } from '@/lib/service-pricing'
import { PricingTable } from './pricing-table'

export const metadata = { title: 'Pricing' }

export default async function PricingAdminPage() {
  await requireAdmin()
  const overrides = await getAllServicePricing()

  const rows = SERVICES.map((s) => {
    const o = overrides.get(s.id) ?? null
    const extras = (o?.extras ?? {}) as Record<string, unknown>
    return {
      service_slug: s.id,
      title: s.title,
      category: s.category,
      audience: s.audience.join(', '),
      defaultLabel: s.price,
      plan_monthly_cents: o?.plan_monthly_cents ?? null,
      plan_annual_cents: o?.plan_annual_cents ?? null,
      plan_onetime_cents: o?.plan_onetime_cents ?? null,
      custom_label: o?.custom_label ?? null,
      active: o?.active ?? true,
      hasOverride: Boolean(o),
      revision_price_cents:
        typeof extras.revision_price_cents === 'number' ? extras.revision_price_cents : null,
      first_revision_free:
        typeof extras.first_revision_free === 'boolean'
          ? extras.first_revision_free
          : true,
      additional_brand_price_cents:
        typeof extras.additional_brand_price_cents === 'number'
          ? extras.additional_brand_price_cents
          : null,
    }
  })

  const categoriesByKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Pricing</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
          Service catalog pricing
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          One row per catalog service. Set monthly / annual / one-time amounts in dollars.
          Leaving every plan blank falls back to the catalog default. The override changes
          both the marketplace tile and the PDP price.
        </p>
      </div>

      <PricingTable rows={rows} categoriesByKey={categoriesByKey} />
    </div>
  )
}
