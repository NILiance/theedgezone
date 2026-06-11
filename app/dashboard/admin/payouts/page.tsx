import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Payouts' }

export default function Page() {
  return (
    <AdminStub
      title="Talent Payouts"
      description="Track talent earnings from tips, merch, shoutouts, and memberships. Platform fee: 15%."
      features={[
        'KPI tiles: Gross Revenue / Platform Earned / Owed to Talent / Total Paid Out',
        'Outstanding balances table (Talent, Gross, We Earned, Owed, Paid Out, Txns, Method)',
        'Action: trigger payout per talent',
        'Revenue Report with date range filter',
        'Period summary (Revenue / We Earned / Paid to Talent / Transactions)',
        'Transaction-level table',
        'Export CSV',
      ]}
      module="EdgeZoneFulfillment (Stripe Connect)"
    />
  )
}
