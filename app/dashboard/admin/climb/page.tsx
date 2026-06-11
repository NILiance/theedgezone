import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Climb Studio' }

export default function Page() {
  return (
    <AdminStub
      title="Climb Studio"
      description="Configure the public Path-to-the-Summit climb — narrator videos, hero images, slides, marketing reel, and analytics."
      features={[
        'HeyGen Narrator Config (API key + default avatar/voice synced from HeyGen)',
        'Narration management per stop',
        'Hero image generation chain (OpenAI DALL-E 3 → Replicate Flux → Unsplash)',
        'Slide management for the 40-stop climb',
        'Platform reel (auto-cut marketing video)',
        'Climb engagement analytics per stop',
      ]}
      module="EdgeZoneClimbAdmin + EdgeZoneClimb"
    />
  )
}
