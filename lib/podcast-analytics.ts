import { createHash } from 'node:crypto'
import type { createServiceClient } from '@/lib/supabase/server'

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>

const BOT_RE =
  /bot|crawler|spider|facebookexternalhit|preview|slurp|curl|wget|python-requests|headless|monitor|feedfetcher|validator/i

export function isBot(ua: string | null): boolean {
  return !ua || BOT_RE.test(ua)
}

export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for') ?? ''
  const first = xff.split(',')[0]?.trim()
  return first || headers.get('x-real-ip') || 'unknown'
}

export function hashIp(ip: string): string {
  const salt = process.env.ANALYTICS_SALT ?? 'edgezone-podcast'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/**
 * Log a play/download with per-IP dedup so refreshes + HTTP range requests
 * don't inflate counts (downloads 24h window, plays 6h — IAB-ish). Bumps the
 * denormalized counter on success. Best-effort: callers wrap in try/catch.
 */
export async function logPodcastHit(
  supabase: ServiceClient,
  args: {
    podcastId: string
    episodeId: string
    kind: 'play' | 'download'
    ip: string
    ua: string | null
  }
): Promise<void> {
  if (isBot(args.ua)) return
  const ipHash = hashIp(args.ip)
  const windowHours = args.kind === 'download' ? 24 : 6
  const since = new Date(Date.now() - windowHours * 3_600_000).toISOString()

  const { data: recent } = await supabase
    .from('podcast_plays')
    .select('id')
    .eq('episode_id', args.episodeId)
    .eq('kind', args.kind)
    .eq('ip_hash', ipHash)
    .gte('created_at', since)
    .limit(1)
    .maybeSingle()
  if (recent) return // already counted this listener in the window

  await supabase.from('podcast_plays').insert({
    podcast_id: args.podcastId,
    episode_id: args.episodeId,
    kind: args.kind,
    ip_hash: ipHash,
    ua: args.ua?.slice(0, 300) ?? null,
  })
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<unknown>
  await rpc('bump_podcast_count', { p_episode: args.episodeId, p_kind: args.kind })
}
