import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Podcasts' }

export default async function PodcastsAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('id, slug, title, description, status, user_id, created_at, rss_url')
    .order('created_at', { ascending: false })
    .limit(500)
  const userIds = Array.from(new Set((podcasts ?? []).map((p) => p.user_id).filter(Boolean) as string[]))
  const profilesById = new Map<string, { display_name: string | null; email: string | null }>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds)
    for (const p of profiles ?? []) profilesById.set(p.id, { display_name: p.display_name, email: null })
    const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
    for (const u of usersRes?.users ?? []) {
      const ex = profilesById.get(u.id) ?? { display_name: null, email: null }
      profilesById.set(u.id, { ...ex, email: u.email ?? null })
    }
  }
  const podcastIds = (podcasts ?? []).map((p) => p.id)
  const { data: episodes } = podcastIds.length
    ? await supabase.from('podcast_episodes').select('podcast_id').in('podcast_id', podcastIds)
    : { data: [] as { podcast_id: string }[] }
  const episodeCount = new Map<string, number>()
  for (const e of episodes ?? []) episodeCount.set(e.podcast_id, (episodeCount.get(e.podcast_id) ?? 0) + 1)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Podcasts</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">All podcasts</h2>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Podcast</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Episodes</th>
              <th className="px-3 py-2 text-left">RSS</th>
            </tr>
          </thead>
          <tbody>
            {(podcasts ?? []).map((p) => {
              const owner = profilesById.get(p.user_id) ?? null
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="text-display font-bold">{p.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">/podcast/{p.slug}</p>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {owner?.display_name ?? '—'}
                    {owner?.email && <p className="text-muted-foreground">{owner.email}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        p.status === 'live'
                          ? 'bg-success/20 text-success'
                          : 'bg-panel-elevated text-muted-foreground'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs">{episodeCount.get(p.id) ?? 0}</td>
                  <td className="px-3 py-2 text-xs">
                    {p.rss_url ? (
                      <a href={p.rss_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Feed →
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })}
            {(podcasts ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No podcasts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
