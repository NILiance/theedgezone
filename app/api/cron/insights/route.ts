import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { generateInsightForUser } from '@/lib/insights'
import { sendEmail } from '@/lib/resend'
import { insightsEmail } from '@/lib/emails/insights'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Weekly insights cron — scheduled via vercel.json.
 *
 * Walks every talent profile, generates the week's insight, persists it, and
 * fires an email. Authorization: requires Authorization: Bearer $CRON_SECRET.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .not('id', 'is', null)

  let processed = 0
  let emailed = 0
  const errors: string[] = []

  for (const p of profiles ?? []) {
    const result = await generateInsightForUser(p.id)
    processed += 1
    if (!result.ok) {
      errors.push(`${p.id}: ${result.error}`)
      continue
    }
    const { data: usersRes } = await supabase.auth.admin.getUserById(p.id)
    const email = usersRes?.user?.email
    if (!email) continue
    const { subject, html } = insightsEmail({
      displayName: p.display_name,
      summary: { headline: result.summary.headline, bullets: result.summary.bullets },
      stats: result.stats,
    })
    const send = await sendEmail({
      to: email,
      subject,
      html,
      templateKey: 'weekly_insights',
      metadata: { user_id: p.id, period_start: result.stats.period_start },
    })
    if (send.success) {
      emailed += 1
      await supabase
        .from('weekly_insights')
        .update({ emailed_at: new Date().toISOString() })
        .eq('id', result.insightId)
    } else {
      errors.push(`${email}: ${send.error}`)
    }
  }

  return NextResponse.json({
    processed,
    emailed,
    errors: errors.slice(0, 20),
  })
}
