import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatEasternDate } from '@/lib/format-date'
import { EpisodePlayer } from './episode-player'
import { SubscribePanel } from './subscribe-panel'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

async function viewerCanPreview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerUserId: string
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  if (user.id === ownerUserId) return true
  const { data: adminRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()
  return Boolean(adminRow)
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('title, description')
    .eq('slug', slug)
    .maybeSingle()
  if (!podcast) return { title: 'Podcast' }
  return { title: podcast.title, description: podcast.description ?? undefined }
}

function fmtDuration(s: number | null): string {
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.round(s % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

export default async function PublicPodcastPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { preview } = await searchParams
  const supabase = await createClient()

  const { data: podcast } = await supabase
    .from('podcasts')
    .select(
      'id, slug, title, description, cover_url, author, primary_color, secondary_color, status, user_id, apple_url, spotify_url, youtube_url, amazon_url, subscription_enabled, subscription_price_cents'
    )
    .eq('slug', slug)
    .maybeSingle()
  if (!podcast) notFound()

  let isOwnerOrAdmin = false
  if (podcast.status !== 'live') {
    isOwnerOrAdmin = await viewerCanPreview(supabase, podcast.user_id)
    if (!isOwnerOrAdmin) notFound()
  }
  const isPreview = podcast.status !== 'live'

  const { data: episodes } = await supabase
    .from('podcast_episodes')
    .select(
      'id, episode_number, season_number, title, description, audio_url, duration_seconds, published_at, image_url, transcript, premium'
    )
    .eq('podcast_id', podcast.id)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  const primary = (podcast as { primary_color?: string }).primary_color || '#C8A84E'
  const secondary = (podcast as { secondary_color?: string }).secondary_color || '#0a0a0a'
  const feedUrl = `/podcasts/${podcast.slug}/feed.xml`

  return (
    <main className="min-h-screen" style={{ background: secondary, color: '#fff' }}>
      {isPreview && (
        <div className="bg-accent px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-accent-foreground">
          Preview · {podcast.status} · not visible to the public
        </div>
      )}

      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-14 text-center sm:flex-row sm:text-left">
        {podcast.cover_url ? (
          <Image
            src={podcast.cover_url}
            alt={podcast.title}
            width={220}
            height={220}
            unoptimized
            className="h-44 w-44 shrink-0 rounded-2xl object-cover shadow-2xl sm:h-52 sm:w-52"
          />
        ) : (
          <div
            className="flex h-44 w-44 shrink-0 items-center justify-center rounded-2xl text-5xl font-black sm:h-52 sm:w-52"
            style={{ background: primary, color: secondary }}
          >
            {podcast.title.slice(0, 1)}
          </div>
        )}
        <div>
          <h1 className="text-display text-4xl font-black tracking-tight sm:text-5xl">
            {podcast.title}
          </h1>
          {podcast.author && (
            <p className="mt-1 text-sm" style={{ color: primary }}>
              {podcast.author}
            </p>
          )}
          {podcast.description && (
            <p className="mt-3 max-w-2xl text-sm text-white/70">{podcast.description}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <a
              href={feedUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
              style={{ background: primary, color: secondary }}
            >
              RSS feed
            </a>
            {(
              [
                ['Apple Podcasts', (podcast as { apple_url?: string | null }).apple_url],
                ['Spotify', (podcast as { spotify_url?: string | null }).spotify_url],
                ['YouTube', (podcast as { youtube_url?: string | null }).youtube_url],
                ['Amazon Music', (podcast as { amazon_url?: string | null }).amazon_url],
              ] as const
            )
              .filter(([, url]) => Boolean(url))
              .map(([label, url]) => (
                <a
                  key={label}
                  href={url as string}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80 hover:bg-white/10"
                >
                  {label}
                </a>
              ))}
          </div>
        </div>
      </section>

      {(podcast as { subscription_enabled?: boolean }).subscription_enabled &&
      (podcast as { subscription_price_cents?: number }).subscription_price_cents ? (
        <section className="mx-auto max-w-4xl px-6 pb-2">
          <SubscribePanel
            podcastId={podcast.id}
            priceCents={(podcast as { subscription_price_cents: number }).subscription_price_cents}
            primary={primary}
            secondary={secondary}
          />
        </section>
      ) : null}

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <p
          className="text-display mb-4 text-xs font-bold uppercase tracking-widest"
          style={{ color: primary }}
        >
          {(episodes ?? []).length} episode{(episodes ?? []).length === 1 ? '' : 's'}
        </p>
        {(episodes ?? []).length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-white/60">
            No episodes published yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-3">
            {(episodes ?? []).map((e) => (
              <article key={e.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-display font-bold">
                      {e.episode_number ? `#${e.episode_number} · ` : ''}
                      {e.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-white/50">
                      {e.published_at
                        ? formatEasternDate(e.published_at)
                        : ''}
                      {e.duration_seconds ? ` · ${fmtDuration(e.duration_seconds)}` : ''}
                    </p>
                  </div>
                </div>
                {e.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-white/70">{e.description}</p>
                )}
                {(e as { premium?: boolean }).premium ? (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/60">
                    <span>🔒</span> Premium — subscribe to listen in your podcast app.
                  </div>
                ) : (
                  e.audio_url && (
                    <EpisodePlayer episodeId={e.id} src={e.audio_url} className="mt-3 w-full" />
                  )
                )}
                {(e as { transcript?: string | null }).transcript && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white">
                      Transcript
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                      {(e as { transcript?: string | null }).transcript}
                    </p>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-white/40">
        Powered by{' '}
        <a href="https://theedgezone.com" style={{ color: primary }}>
          Edge Zone
        </a>
      </footer>
    </main>
  )
}
