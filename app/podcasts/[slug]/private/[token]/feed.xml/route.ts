import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildPodcastRss, type RssEpisode } from '@/lib/podcast-rss'

export const dynamic = 'force-dynamic'

/** Private subscriber feed — includes premium episodes. Auth by feed token. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params
  const supabase = createServiceClient()
  if (!supabase) return new Response('Not available', { status: 503 })

  const { data: sub } = await supabase
    .from('podcast_subscriptions')
    .select('podcast_id, status')
    .eq('feed_token', token)
    .maybeSingle()
  if (!sub || (sub as { status?: string }).status !== 'active') {
    return new Response('Invalid or inactive feed token', { status: 403 })
  }

  const { data: podcast } = await supabase
    .from('podcasts')
    .select(
      'id, title, description, slug, cover_url, author, category, language, explicit, apple_connect_email, status'
    )
    .eq('id', sub.podcast_id)
    .eq('slug', slug)
    .maybeSingle()
  if (!podcast || podcast.status !== 'live') return new Response('Podcast not found', { status: 404 })

  // All published episodes — including premium (the point of the private feed).
  const { data: episodes } = await supabase
    .from('podcast_episodes')
    .select(
      'id, title, description, audio_url, audio_bytes, audio_mime, duration_seconds, published_at, guid, episode_number, season_number, explicit, image_url, chapters'
    )
    .eq('podcast_id', podcast.id)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  const origin = request.nextUrl.origin
  const xml = buildPodcastRss(podcast, (episodes ?? []) as unknown as RssEpisode[], {
    siteUrl: origin,
    feedUrl: `${origin}/podcasts/${slug}/private/${token}/feed.xml`,
    slug,
  })
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  })
}
