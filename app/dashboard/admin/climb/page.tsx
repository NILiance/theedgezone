import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { ClimbAdminClient } from './client'

export const metadata = { title: 'Climb Studio' }

export default async function ClimbAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: milestones } = await supabase
    .from('climb_milestones')
    .select(
      'id, slug, title, summary, position, hero_image_url, video_url, slides, cta_label, cta_url, duration_min, audience, published'
    )
    .order('position', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Climb Studio</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
          Path to the Summit
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Edit milestones in order. Each one is a stop on the climb — hero image, optional
          narrator video, optional CTA back into the dashboard.
        </p>
      </div>
      <ClimbAdminClient
        milestones={(milestones ?? []) as Array<{
          id: string
          slug: string
          title: string
          summary: string | null
          position: number
          hero_image_url: string | null
          video_url: string | null
          slides: Array<{ heading?: string; body?: string; media_url?: string }>
          cta_label: string | null
          cta_url: string | null
          duration_min: number | null
          audience: string
          published: boolean
        }>}
      />
    </div>
  )
}
