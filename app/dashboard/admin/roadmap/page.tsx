import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Roadmap Builder' }

export default function Page() {
  return (
    <AdminStub
      title="Roadmap Builder"
      description="Configure the roadmap items shown for each user goal. When a user selects goals in their profile, the personalized roadmap pulls these items."
      features={[
        '16 goals (Learn about NIL, Grow following, Sell products, Establish digital identity, Prepare for NIL deal, Enhance athletic performance, Protect NIL, Financial guidance, Mental + physical health, Enhance NIL on a budget, Attract brand partnerships, Build a personal brand, Create content, Contract negotiation, Life after sports, Network with other talent)',
        'Per-goal item editor (3-6 items per goal observed in legacy)',
        '+ Add item per goal',
        '× Remove individual items',
        'Save goal config action',
      ]}
      module="EdgeZoneCore (Roadmap view)"
    />
  )
}
