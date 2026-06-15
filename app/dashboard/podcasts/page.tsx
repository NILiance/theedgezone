import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BuildFromPicker } from '@/components/dashboard/build-from-picker'
import { createPodcast } from './actions'

export const metadata = { title: 'My podcasts' }

export default async function PodcastsIndexPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('id, slug, title, description, status, created_at, rss_url, cover_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <p className="text-eyebrow mt-3 text-accent">Podcasts</p>
          <h1 className="text-display mt-1 text-3xl font-black tracking-tight">Your podcasts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan episodes, upload audio, and publish to Apple Podcasts + Spotify via RSS.
          </p>
        </div>
        <BuildFromPicker
          action={createPodcast}
          what="Podcast"
          profileSections={['name', 'tagline', 'sport']}
          triggerLabel="+ New podcast"
        />
      </div>

      {(!podcasts || podcasts.length === 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>No podcasts yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click <strong>+ New podcast</strong> to scaffold one. You can pull title + tagline
              from your profile, then add cover art, your Apple Connect email, and start uploading
              episodes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {podcasts.map((p) => (
            <Card key={p.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <span
                    className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      p.status === 'live'
                        ? 'bg-success/20 text-success'
                        : 'bg-panel-elevated text-muted-foreground'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                {p.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  /podcast/{p.slug}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/dashboard/podcasts/${p.id}`}
                    className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1 font-bold uppercase tracking-widest"
                  >
                    Open →
                  </Link>
                  {p.rss_url && (
                    <a
                      href={p.rss_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1 font-bold uppercase tracking-widest"
                    >
                      RSS
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
