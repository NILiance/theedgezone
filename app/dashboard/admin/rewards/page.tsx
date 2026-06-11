import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Rewards Store' }

export default function Page() {
  return (
    <AdminStub
      title="Rewards Store"
      description="Items members can redeem with earned points. Items appear in the Points tab of their dashboard."
      features={[
        'Reward item table (Image, Name, Points, Stock, Status, Actions)',
        '+ ADD REWARD ITEM action',
        'EDIT and DELETE actions per item',
        'Active / Inactive status',
        'Stock count or unlimited',
        'Recent Redemptions section',
      ]}
      module="EdgeZoneCore"
    />
  )
}
