import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Websites' }

export default function Page() {
  return (
    <AdminStub
      title="Talent Websites"
      description="Every talent personal website built on the Edge Zone site builder."
      features={[
        'List of athlete websites',
        'Per-row: athlete name + email, status (Live / Draft) + slug',
        'EDIT and DELETE actions',
        'Subdomain at slug.mytalentsite.com',
        'Custom-domain status indicator',
      ]}
      module="TalentSiteBuilder"
    />
  )
}
