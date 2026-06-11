import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Brand Designs' }

export default function Page() {
  return (
    <AdminStub
      title="Brand Designs"
      description="All talent brand-design portals. Open the studio, manage credits, reset, or regenerate per brand."
      features={[
        'Card grid of all brand designs',
        'Per-card: athlete name + email, status (COMPLETED/DRAFT), progress (R1: 10, R2: 12, Kit: 15 files), created date',
        'Credits display (Asset Credits used / total, Logo Concept Credits)',
        'Actions: Open Studio, Preview, Asset Credits, Logo Credits, Build Kit, Reset, Regenerate, Delete',
        'Per-logo ACTIVE / Completed sub-state with Reset, Build Kit, Regen',
      ]}
      module="BrandDesign + EdgeZoneFulfillment"
    />
  )
}
