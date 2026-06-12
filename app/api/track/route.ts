import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

/**
 * Public view-tracking endpoint.
 * Hit from the public site renderer to record a page view.
 *
 * POST /api/track
 * Body: { site_id, page_id, path }
 *
 * IP and UA are hashed so we never store PII raw.
 */
export async function POST(request: NextRequest) {
  let body: { site_id?: string; page_id?: string; path?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad JSON' }, { status: 400 })
  }
  if (!body.site_id || !body.path) {
    return NextResponse.json({ ok: false, error: 'Missing site_id/path' }, { status: 400 })
  }

  const fwd = request.headers.get('x-forwarded-for') ?? ''
  const ip = fwd.split(',')[0]?.trim() || request.headers.get('x-real-ip') || ''
  const ua = request.headers.get('user-agent') ?? ''
  const referrer = request.headers.get('referer') ?? null
  const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 24) : null

  const supabase = await createClient()
  await supabase.from('site_page_views').insert({
    site_id: body.site_id,
    page_id: body.page_id ?? null,
    path: body.path,
    ip_hash: ipHash,
    user_agent: ua.slice(0, 500),
    referrer: referrer?.slice(0, 500) ?? null,
  })

  return NextResponse.json({ ok: true })
}
