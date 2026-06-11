import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'App Defaults' }

export default function Page() {
  return (
    <AdminStub
      title="App Builder Defaults"
      description="Default links, ad placements, and merch behavior applied to every generated talent app. Talent can override per-app."
      features={[
        'Default Links table (Title, URL, Icon, Position: Nav Grid / Links Screen / Footer)',
        'Splash Banner ad (Image URL + Click URL + Label + enabled toggle)',
        'Footer Banner ad (persistent footer; hidden on splash if nav hidden)',
        'In-Feed Ad with frequency (every N items)',
        'Interstitial ad (between screen navs)',
        'Auto-enroll new apps in Edge Zone merch (Yes/No)',
        'Show platform merch in talent shop screens (Yes/No)',
        'Revenue share — talent % (platform receives remainder)',
      ]}
      module="AppsForTalent"
    />
  )
}
