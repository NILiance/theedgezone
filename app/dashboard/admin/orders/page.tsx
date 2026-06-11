import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Orders' }

export default function Page() {
  return (
    <AdminStub
      title="Orders"
      description="Every order placed across the platform. Filterable, sortable, with per-order admin actions."
      features={[
        'Sort by newest / oldest / highest $ / lowest $',
        'Columns: ID, Product, Customer, Plan, Amount, Status, Date',
        'Status badges (Active, Paid, Provisioning, Ready, Cancelled, Refunded)',
        'CRM sync indicator per order',
        'Delete action per order (admin only)',
        'Linked Stripe payment intent + session for fulfillment lookup',
      ]}
      module="EdgeZoneFulfillment"
    />
  )
}
