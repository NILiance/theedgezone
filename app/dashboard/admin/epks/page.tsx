import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'EPKs' }

export default function Page() {
  return (
    <AdminStub
      title="Electronic Press Kits"
      description="All Electronic Press Kit instances built on the Edge Zone EPK editor."
      features={[
        'List of athlete EPKs',
        'Per-row: athlete name + email, status (Live / Draft) + slug',
        'EDIT and DELETE actions',
        'Subdomain at slug.talentepk.com',
        'Custom-domain status indicator',
      ]}
      module="TalentEPK"
    />
  )
}
