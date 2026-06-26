import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { ClimbAdminClient } from './client'
import { ClimbReelBuilder, type ReelData, type VideoMilestone } from './reel-builder'

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
      'id, slug, title, summary, position, hero_image_url, video_url, slides, cta_label, cta_url, duration_min, audience, published, heygen_job_id, heygen_status, heygen_prompt, heygen_error, heygen_started_at, heygen_completed_at, heygen_avatar_id, heygen_voice_id'
    )
    .order('position', { ascending: true })

  // Platform Reel: the singleton config + the milestones that have a video.
  const { data: reelRow } = await supabase
    .from('climb_reel')
    .select('title, subtitle, milestone_ids, published')
    .eq('singleton', true)
    .maybeSingle()
  const reel: ReelData = {
    title: (reelRow?.title as string) ?? 'Path to the Summit',
    subtitle: (reelRow?.subtitle as string | null) ?? null,
    milestone_ids: Array.isArray(reelRow?.milestone_ids)
      ? (reelRow!.milestone_ids as string[])
      : [],
    published: Boolean(reelRow?.published),
  }
  const videoMilestones: VideoMilestone[] = (milestones ?? [])
    .filter((m) => Boolean(m.video_url))
    .map((m) => ({ id: m.id, title: m.title, video_url: m.video_url as string }))

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

      <ClimbReelBuilder reel={reel} videoMilestones={videoMilestones} />
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
          heygen_job_id?: string | null
          heygen_status?: string | null
          heygen_prompt?: string | null
          heygen_error?: string | null
          heygen_started_at?: string | null
          heygen_completed_at?: string | null
          heygen_avatar_id?: string | null
          heygen_voice_id?: string | null
        }>}
      />
    </div>
  )
}
