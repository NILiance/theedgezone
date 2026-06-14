import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { RoadmapAdminClient } from './client'

export const metadata = { title: 'Roadmap Builder' }

export default async function RoadmapAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing — roadmap management needs it.
      </p>
    )
  }

  const [{ data: phases }, { data: items }] = await Promise.all([
    supabase
      .from('roadmap_phases')
      .select('id, slug, name, description, icon, position, published')
      .order('position', { ascending: true }),
    supabase
      .from('roadmap_items')
      .select(
        'id, phase_id, slug, name, description, audience, position, recommended_action_url, recommended_action_label, published'
      )
      .order('position', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Roadmap</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Roadmap Builder</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Phases group milestones; items are the individual milestones. The public{' '}
          <strong>/roadmap</strong> page renders this structure. Talents check items off in their
          dashboard.
        </p>
      </div>
      <RoadmapAdminClient
        phases={(phases ?? []) as Array<{
          id: string
          slug: string
          name: string
          description: string | null
          icon: string | null
          position: number
          published: boolean
        }>}
        items={(items ?? []) as Array<{
          id: string
          phase_id: string | null
          slug: string
          name: string
          description: string | null
          audience: string
          position: number
          recommended_action_url: string | null
          recommended_action_label: string | null
          published: boolean
        }>}
      />
    </div>
  )
}
