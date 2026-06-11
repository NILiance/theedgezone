import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Tickets' }

export default function Page() {
  return (
    <AdminStub
      title="Support Tickets"
      description="Inbound support requests from talent and brands. Triage, assign, resolve."
      features={[
        'KPI tiles: Open / In Progress / Resolved Today',
        'Filter tabs: All / Open / In Progress / Resolved',
        'Per-ticket: subject, user name, category, opened date, status',
        'Expandable ticket detail (▼)',
        'Thread of messages with admin replies',
        'Status transitions: Open → In Progress → Resolved',
        'Email notifications via Resend',
      ]}
      module="EdgeZoneCore"
    />
  )
}
