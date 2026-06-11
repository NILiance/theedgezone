import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Users' }

export default function Page() {
  return (
    <AdminStub
      title="Users"
      description="Every user across the platform. Filter by role, search, and manage individual accounts."
      features={[
        'Filter tabs: All / Talent / Brand',
        'Search by name or email',
        'Per-user modal with edit fields',
        'NIL profile completion %',
        'Points earned',
        'Referral code',
        'NILiance link status with UUID',
        'Inline actions: edit, delete, promote/demote',
      ]}
      module="EdgeZoneCore"
    />
  )
}
