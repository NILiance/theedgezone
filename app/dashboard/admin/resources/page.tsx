import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Resources' }

export default function Page() {
  return (
    <AdminStub
      title="Resource Library"
      description="Free downloadable resources for members. Filtered by audience on the public Resources page."
      features={[
        'Category → audience mapping (Everyone / Talent Only / Brands Only)',
        'WordPress Download Manager Pro integration during transition',
        'Per-category resource count',
        'Manual resources beyond WPDM (+ Add Resource)',
        'New WPDM categories auto-appear for audience assignment',
        'Save category mapping action',
      ]}
      module="EdgeZoneCore (Resources view)"
    />
  )
}
