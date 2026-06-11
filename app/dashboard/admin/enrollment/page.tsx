import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Enrollment' }

export default function Page() {
  return (
    <AdminStub
      title="Enrollment & Outreach"
      description="Bulk-enroll users from CSV, send templated outreach emails."
      features={[
        'Bulk Enrollment CSV upload (columns: name, email, sport, school, programs)',
        'Preview CSV before commit',
        'Manual enrollment form (Name, Email, Sport, School, Programs multi-select)',
        'Email outreach: load recipient list (CSV or all enrolled users)',
        'Email template with variables: {NAME} {EMAIL} {PROGRAMS} {LOGIN_URL} {SCHOOL}',
        'Save template + send to list',
      ]}
      module="EdgeZoneCore"
    />
  )
}
