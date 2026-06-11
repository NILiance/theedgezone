import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Pages' }

export default function Page() {
  return (
    <AdminStub
      title="Site Pages"
      description="Manage every page on the public site — service detail pages, shortcode-driven views, and legacy WordPress pages during the transition."
      features={[
        'List of every service detail page (53 marketplace slugs)',
        'Shortcode views (home, directory, where_to_start, roadmap, login, register)',
        'WordPress legacy pages (for the transition period)',
        'Source / Status / Last updated columns',
        'Inline EDIT actions',
        '+ NEW PAGE button for custom landing pages',
      ]}
      module="EdgeZoneCore + EdgeZoneMarketplace"
    />
  )
}
