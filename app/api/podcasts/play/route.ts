import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logPodcastHit, clientIp } from '@/lib/podcast-analytics'

export const dynamic = 'force-dynamic'

/** Beacon fired by the public player when an episode starts playing. */
export async function POST(request: NextRequest) {
  let body: { episode_id?: string } = {}
  try {
    body = await request.json()
  } catch {
    /* sendBeacon may post a blob — already handled by json() */
  }
  const episodeId = body.episode_id
  if (!episodeId) return new NextResponse(null, { status: 204 })

  const supabase = await createClient()
  const { data: episode } = await supabase
    .from('podcast_episodes')
    .select('id, podcast_id, podcasts!inner(status)')
    .eq('id', episodeId)
    .maybeSingle()
  const status = (episode as { podcasts?: { status?: string } } | null)?.podcasts?.status
  if (!episode || status !== 'live') return new NextResponse(null, { status: 204 })

  const service = createServiceClient()
  if (service) {
    try {
      await logPodcastHit(service, {
        podcastId: episode.podcast_id,
        episodeId: episode.id,
        kind: 'play',
        ip: clientIp(request.headers),
        ua: request.headers.get('user-agent'),
      })
    } catch {
      /* best-effort */
    }
  }
  return new NextResponse(null, { status: 204 })
}
