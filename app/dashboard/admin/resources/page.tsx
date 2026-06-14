import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { ResourcesAdminClient } from './client'

export const metadata = { title: 'Resources' }

export default async function ResourcesAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()

  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing — resources management needs it.
      </p>
    )
  }

  const [{ data: resources }, { data: categories }] = await Promise.all([
    supabase
      .from('resources')
      .select(
        'id, slug, title, description, audience, category_id, file_url, thumbnail_url, external_url, featured, published, download_count, view_count, created_at'
      )
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('resource_categories')
      .select('id, slug, name, description, icon, position')
      .order('position', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Resources</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Resource Library</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the public catalog at <strong>/resources</strong>. Audience-scoped chips on
          the public page filter the list automatically.
        </p>
      </div>

      <ResourcesAdminClient
        resources={(resources ?? []) as Array<{
          id: string
          slug: string
          title: string
          description: string | null
          audience: string
          category_id: string | null
          file_url: string | null
          thumbnail_url: string | null
          external_url: string | null
          featured: boolean
          published: boolean
          download_count: number
          view_count: number
          created_at: string
        }>}
        categories={(categories ?? []) as Array<{
          id: string
          slug: string
          name: string
          description: string | null
          icon: string | null
          position: number
        }>}
      />
    </div>
  )
}
