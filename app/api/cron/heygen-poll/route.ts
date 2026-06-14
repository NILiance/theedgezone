import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { getHeyGenStatus, heygenConfigured } from '@/lib/heygen'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron: every 2 minutes, polls any in-flight HeyGen jobs and updates
 * climb_milestones with completion status + video_url when ready.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!heygenConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'HEYGEN_API_KEY not configured' })
  }
  const supabase = createServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Service role missing' }, { status: 500 })

  const { data: jobs } = await supabase
    .from('climb_milestones')
    .select('id, heygen_job_id')
    .in('heygen_status', ['pending', 'processing', 'waiting'])
    .not('heygen_job_id', 'is', null)
    .limit(50)

  let processed = 0
  let completed = 0
  let failed = 0
  for (const j of jobs ?? []) {
    if (!j.heygen_job_id) continue
    const res = await getHeyGenStatus(j.heygen_job_id)
    if (!res.ok) {
      failed += 1
      continue
    }
    const update: Record<string, unknown> = {
      heygen_status: res.status.status,
      heygen_error: res.status.error,
    }
    if (res.status.status === 'completed' && res.status.videoUrl) {
      update.video_url = res.status.videoUrl
      update.heygen_completed_at = new Date().toISOString()
      completed += 1
    } else if (res.status.status === 'failed') {
      update.heygen_completed_at = new Date().toISOString()
      failed += 1
    }
    await supabase.from('climb_milestones').update(update).eq('id', j.id)
    processed += 1
  }
  return NextResponse.json({ processed, completed, failed })
}
