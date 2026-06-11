import { getBrandingSettings } from '@/lib/branding'
import { BrandingForm } from '@/components/forms/branding-form'

export const metadata = { title: 'Branding' }

export default async function BrandingAdminPage() {
  const settings = await getBrandingSettings()
  return (
    <div className="max-w-2xl">
      <BrandingForm defaults={settings} />
    </div>
  )
}
