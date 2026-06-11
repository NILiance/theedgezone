import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Integrations' }

export default function Page() {
  return (
    <AdminStub
      title="Integrations"
      description="API credentials and integration configuration for every external system Edge Zone connects to."
      features={[
        'Stripe Payments (test + live publishable + secret + webhook secret)',
        'PayPal Payouts (sandbox + live + platform fee %)',
        'Smart Engine (Claude + Gemini API keys)',
        'Image Generation (OpenAI DALL-E 3 → Replicate Flux → Unsplash fallback)',
        'Ideogram v3 (Brand Design logo generation)',
        'Phyllo (social data import)',
        'Vectorizer.ai (raster → SVG)',
        'Google Drive Shared Drive (asset storage)',
        'CRM REST + webhook secret + AJAX legacy fallback',
        'Namecheap (talent custom-domain reseller)',
        'cPanel × 2 (mytalentsite.com + talentepk.com subdomain routing)',
        'OneSource / PromoStandards (500+ promo product suppliers)',
        'Service → CRM Program Mapping (38 talent + 33 brand services)',
      ]}
      module="EdgeZoneCore + EdgeZoneFulfillment"
    />
  )
}
