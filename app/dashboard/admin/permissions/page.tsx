import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Permissions' }

export default function Page() {
  return (
    <AdminStub
      title="Permission System"
      description="Control what each user type can access. Super Admins always have full access. Create limited admin roles and restrict user capabilities."
      features={[
        'Sub-tabs: Role Permissions / Staff Accounts',
        'Talent capabilities (9): View Marketplace, Purchase Services, Brand Design Studio, Website Editor, EPK Editor, Free Resources, Roadmap, Support Tickets, Rewards Store',
        'Brand capabilities (6): View Marketplace, Purchase Services, Talent Search, Free Resources, Roadmap, Support Tickets',
        'Matrix UI: capability × audience type with ON/OFF toggles',
        'Save permissions action',
        'Staff accounts management',
      ]}
      module="EdgeZoneCore"
    />
  )
}
