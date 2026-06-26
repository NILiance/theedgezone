import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logPodcastHit, clientIp } from '@/lib/podcast-analytics'

export const dynamic = 'force-dynamic'

/**
 * Enclosure redirect — the RSS feed points every episode's audio here so
 * downloads can be counted (the standard podcast-host approach), then we 302
 * to the real storage URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const supabase = await createClient()
  const { data: episode } = await supabase
    .from('podcast_episodes')
    .select('id, audio_url, podcast_id, podcasts!inner(slug, status)')
    .eq('id', id)
    .maybeSingle()

  const pod = (episode as { podcasts?: { slug?: string; status?: string } } | null)?.podcasts
  if (!episode || !episode.audio_url || pod?.status !== 'live' || pod?.slug !== slug) {
    return new NextResponse('Not found', { status: 404 })
  }

  const service = createServiceClient()
  if (service) {
    try {
      await logPodcastHit(service, {
        podcastId: episode.podcast_id,
        episodeId: episode.id,
        kind: 'download',
        ip: clientIp(request.headers),
        ua: request.headers.get('user-agent'),
      })
    } catch {
      /* best-effort — never block the download */
    }
  }
  return NextResponse.redirect(episode.audio_url, 302)
}
