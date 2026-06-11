import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Mobile Apps' }

export default function Page() {
  return (
    <AdminStub
      title="Mobile Apps"
      description="Branded mobile apps built via the App Builder. Visual editor, PWA + native publishing pipeline."
      features={[
        'KPI tiles: Total Apps / Published / Draft / Revenue',
        'Tabs: All Apps / Ads & Defaults / Orders',
        'Per-app card: athlete + email, status, screen count, slug',
        'Actions: EDIT, VIEW APP, DELETE',
        'Ads & Defaults tab links to App Defaults config',
        'Orders tab shows app-related Stripe transactions',
      ]}
      module="AppsForTalent"
    />
  )
}
