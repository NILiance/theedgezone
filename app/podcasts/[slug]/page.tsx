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
    .select('title, description, cover_url')
    .eq('slug', slug)
    .maybeSingle()
  if (!podcast) return { title: 'Podcast' }
  return {
    title: podcast.title,
    description: podcast.description ?? undefined,
    openGraph: {
      title: podcast.title,
      description: podcast.description ?? undefined,
      images: podcast.cover_url ? [podcast.cover_url] : undefined,
    },
  }
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

type EpisodeRow = {
  id: string
  episode_number: number | null
  season_number: number | null
  title: string
  description: string | null
  audio_url: string | null
  duration_seconds: number | null
  published_at: string | null
  image_url: string | null
  transcript: string | null
  premium: boolean | null
}

export default async function PublicPodcastPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { preview } = await searchParams
  void preview
  const supabase = await createClient()

  const { data: podcast } = await supabase
    .from('podcasts')
    .select(
      'id, slug, title, description, cover_url, author, category, primary_color, secondary_color, status, user_id, apple_url, spotify_url, youtube_url, amazon_url, subscription_enabled, subscription_price_cents'
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

  const { data: episodeData } = await supabase
    .from('podcast_episodes')
    .select(
      'id, episode_number, season_number, title, description, audio_url, duration_seconds, published_at, image_url, transcript, premium'
    )
    .eq('podcast_id', podcast.id)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  const episodes = (episodeData ?? []) as EpisodeRow[]
  const featured = episodes[0] ?? null
  const rest = episodes.slice(1)

  const primary = (podcast as { primary_color?: string }).primary_color || '#C8A84E'
  const secondary = (podcast as { secondary_color?: string }).secondary_color || '#0a0a0a'
  const category = (podcast as { category?: string | null }).category || ''
  const cover = podcast.cover_url || ''
  const feedUrl = `/podcasts/${podcast.slug}/feed.xml`
  const subscriptionOn =
    (podcast as { subscription_enabled?: boolean }).subscription_enabled &&
    (podcast as { subscription_price_cents?: number }).subscription_price_cents

  const listenLinks = (
    [
      ['Apple Podcasts', (podcast as { apple_url?: string | null }).apple_url],
      ['Spotify', (podcast as { spotify_url?: string | null }).spotify_url],
      ['YouTube', (podcast as { youtube_url?: string | null }).youtube_url],
      ['Amazon Music', (podcast as { amazon_url?: string | null }).amazon_url],
    ] as const
  ).filter(([, url]) => Boolean(url)) as [string, string][]

  return (
    <main className="min-h-screen" style={{ background: secondary, color: '#fff' }}>
      {isPreview && (
        <div className="bg-accent px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-accent-foreground">
          Preview · {podcast.status} · not visible to the public
        </div>
      )}

      {/* Sticky site header — gives the show its own "website" chrome. */}
      <header
        className="sticky top-0 z-30 border-b border-white/10"
        style={{ background: secondary }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {cover ? (
              <Image
                src={cover}
                alt=""
                width={36}
                height={36}
                unoptimized
                className="h-9 w-9 shrink-0 rounded-md object-cover"
              />
            ) : null}
            <span className="text-display truncate text-sm font-black tracking-tight">
              {podcast.title}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#episodes"
              className="hidden rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/70 hover:text-white sm:inline-block"
            >
              Episodes
            </a>
            <a
              href={feedUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest"
              style={{ background: primary, color: secondary }}
            >
              {subscriptionOn ? 'Subscribe' : 'Follow'}
            </a>
          </div>
        </div>
      </header>

      {/* Hero — cover art used as a blurred backdrop behind a gradient scrim. */}
      <section className="relative overflow-hidden">
        {cover ? (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(64px)',
              transform: 'scale(1.25)',
              opacity: 0.4,
            }}
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.35), ${secondary} 88%)` }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-16 text-center md:flex-row md:items-end md:text-left">
          {cover ? (
            <Image
              src={cover}
              alt={podcast.title}
              width={260}
              height={260}
              unoptimized
              className="h-48 w-48 shrink-0 rounded-3xl object-cover shadow-2xl ring-1 ring-white/10 md:h-60 md:w-60"
            />
          ) : (
            <div
              className="flex h-48 w-48 shrink-0 items-center justify-center rounded-3xl text-6xl font-black shadow-2xl md:h-60 md:w-60"
              style={{ background: primary, color: secondary }}
            >
              {podcast.title.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <p
              className="text-display text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: primary }}
            >
              {category ? `${category} Podcast` : 'Podcast'}
            </p>
            <h1 className="text-display mt-2 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              {podcast.title}
            </h1>
            {podcast.author && (
              <p className="mt-2 text-sm font-semibold text-white/80">{podcast.author}</p>
            )}
            {podcast.description && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
                {podcast.description}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {listenLinks.map(([label, url]) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-lg transition hover:opacity-90"
                  style={{ background: primary, color: secondary }}
                >
                  ▶ {label}
                </a>
              ))}
              <a
                href={feedUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80 hover:bg-white/10"
              >
                RSS feed
              </a>
            </div>
          </div>
        </div>
      </section>

      {subscriptionOn ? (
        <section className="mx-auto max-w-5xl px-6 pt-4">
          <SubscribePanel
            podcastId={podcast.id}
            priceCents={(podcast as { subscription_price_cents: number }).subscription_price_cents}
            primary={primary}
            secondary={secondary}
          />
        </section>
      ) : null}

      {/* Featured latest episode — front-and-center with a player. */}
      {featured && (
        <section className="mx-auto max-w-5xl px-6 pt-12">
          <p
            className="text-display mb-3 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: primary }}
          >
            Latest episode
          </p>
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="flex flex-col gap-5 p-6 sm:flex-row">
              <Image
                src={featured.image_url || cover || '/favicon.ico'}
                alt=""
                width={160}
                height={160}
                unoptimized
                className="h-32 w-32 shrink-0 self-start rounded-xl object-cover ring-1 ring-white/10 sm:h-40 sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-display text-xl font-black leading-tight sm:text-2xl">
                  {featured.episode_number ? `#${featured.episode_number} · ` : ''}
                  {featured.title}
                </h2>
                <p className="mt-1 text-xs text-white/50">
                  {featured.published_at ? formatEasternDate(featured.published_at) : ''}
                  {featured.duration_seconds ? ` · ${fmtDuration(featured.duration_seconds)}` : ''}
                </p>
                {featured.description && (
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/70">
                    {featured.description}
                  </p>
                )}
                {featured.premium ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/60">
                    <span>🔒</span> Premium — subscribe to listen in your podcast app.
                  </div>
                ) : (
                  featured.audio_url && (
                    <EpisodePlayer
                      episodeId={featured.id}
                      src={featured.audio_url}
                      className="mt-4 w-full"
                    />
                  )
                )}
              </div>
            </div>
          </article>
        </section>
      )}

      {/* All episodes */}
      <section id="episodes" className="mx-auto max-w-5xl px-6 pb-20 pt-12">
        <p
          className="text-display mb-4 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: primary }}
        >
          {episodes.length} episode{episodes.length === 1 ? '' : 's'}
        </p>
        {episodes.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-white/60">
            No episodes published yet. Check back soon.
          </p>
        ) : rest.length === 0 ? (
          <p className="text-sm text-white/50">That&rsquo;s the only episode so far — more on the way.</p>
        ) : (
          <div className="space-y-3">
            {rest.map((e) => (
              <article
                key={e.id}
                className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <Image
                  src={e.image_url || cover || '/favicon.ico'}
                  alt=""
                  width={72}
                  height={72}
                  unoptimized
                  className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-display font-bold leading-snug">
                    {e.season_number ? `S${e.season_number} ` : ''}
                    {e.episode_number ? `#${e.episode_number} · ` : ''}
                    {e.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-white/50">
                    {e.published_at ? formatEasternDate(e.published_at) : ''}
                    {e.duration_seconds ? ` · ${fmtDuration(e.duration_seconds)}` : ''}
                  </p>
                  {e.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-white/70">{e.description}</p>
                  )}
                  {e.premium ? (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/60">
                      <span>🔒</span> Premium — subscribe to listen in your podcast app.
                    </div>
                  ) : (
                    e.audio_url && (
                      <EpisodePlayer episodeId={e.id} src={e.audio_url} className="mt-3 w-full" />
                    )
                  )}
                  {e.transcript && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white">
                        Transcript
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                        {e.transcript}
                      </p>
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-white/40 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {podcast.author || podcast.title}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {listenLinks.map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" className="hover:text-white/80">
                {label}
              </a>
            ))}
            <a href={feedUrl} target="_blank" rel="noreferrer" className="hover:text-white/80">
              RSS
            </a>
            <span>
              Powered by{' '}
              <a href="https://theedgezone.com" style={{ color: primary }}>
                Edge Zone
              </a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}
