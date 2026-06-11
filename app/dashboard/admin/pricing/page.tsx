import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Pricing' }

export default function Page() {
  return (
    <AdminStub
      title="Service Pricing & Tiers"
      description="Per-service pricing across monthly, annual, and one-time tiers. Optional Basic/Pro/Premium tier bundles."
      features={[
        'Pricing inputs for all 54 services in the catalog',
        'Monthly / Yearly / One-time fields per service',
        '+ Tiers for Basic/Pro/Premium bundle packs',
        'Grouped by category (Digital Presence, Brand & Design, etc.)',
        'Employee Benefits group (Financial Wellness / Legal Support / etc.)',
        'Separate Brand Design pricing block: asset credits, revision price, custom graphic price, logo modification, additional logo, concept logo, extra concept batch',
      ]}
      module="EdgeZoneMarketplace + EdgeZoneFulfillment"
    />
  )
}
