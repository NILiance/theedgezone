import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'NIL Stores' }

export default function Page() {
  return (
    <AdminStub
      title="NIL Stores"
      description="Talent POD storefronts powered by supplier APIs. Two ways to add products: print-on-demand or wholesale resale."
      features={[
        'KPI tiles: Total Stores / Published / Orders / Revenue',
        'Tabs: All Stores / Platform Defaults / Approved Products / Suppliers / Fulfillment Config / Orders',
        'Per-store: athlete + email, status, product count, commission % override',
        'Actions: Save, EDIT, VIEW STORE, LOGO CREDITS, RESET DESIGN STUDIO',
        'Platform default commission to talent (% of net margin)',
        'Supplier integrations: S&S, SanMar, Alphabroder, Gemline, OneSource',
      ]}
      module="NilStores"
    />
  )
}
