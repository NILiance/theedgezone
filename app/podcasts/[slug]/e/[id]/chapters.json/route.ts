import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function tcToSeconds(tc: string): number {
  const parts = String(tc).trim().split(':').map((p) => Number(p))
  if (parts.some((n) => Number.isNaN(n))) return 0
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!
  return parts[0] || 0
}

/** podcast-namespace chapters JSON (application/json+chapters). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const supabase = await createClient()
  const { data: episode } = await supabase
    .from('podcast_episodes')
    .select('id, chapters, podcasts!inner(slug, status)')
    .eq('id', id)
    .maybeSingle()
  const pod = (episode as { podcasts?: { slug?: string; status?: string } } | null)?.podcasts
  if (!episode || pod?.status !== 'live' || pod?.slug !== slug) {
    return NextResponse.json({ version: '1.2.0', chapters: [] }, { status: 404 })
  }

  const raw = Array.isArray((episode as { chapters?: unknown }).chapters)
    ? ((episode as { chapters: Array<{ start?: string; title?: string }> }).chapters)
    : []
  const chapters = raw
    .filter((c) => c && (c.title || c.start))
    .map((c) => ({ startTime: tcToSeconds(c.start ?? '0'), title: c.title ?? '' }))
    .sort((a, b) => a.startTime - b.startTime)

  return NextResponse.json(
    { version: '1.2.0', chapters },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
  )
}
