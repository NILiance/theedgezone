import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPodcastRss, type RssEpisode } from '@/lib/podcast-rss'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  // RLS exposes only live shows + their episodes to anon; we still filter
  // explicitly for clarity and to drop unpublished episodes.
  const { data: podcast } = await supabase
    .from('podcasts')
    .select(
      'id, title, description, slug, cover_url, author, category, language, explicit, apple_connect_email, status'
    )
    .eq('slug', slug)
    .eq('status', 'live')
    .maybeSingle()
  if (!podcast) {
    return new Response('Podcast not found', { status: 404 })
  }

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
    feedUrl: `${origin}/podcasts/${slug}/feed.xml`,
    slug,
  })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
    },
  })
}
