import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExpoPush, type ExpoPushMessage } from '@/lib/expo-push'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron: fires every minute. Sends any push messages whose scheduled_for
 * has elapsed and that are still status='scheduled'.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Service role missing' }, { status: 500 })

  const { data: due } = await supabase
    .from('app_push_messages')
    .select('id, app_id, title, body, data')
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50)

  let processed = 0
  for (const m of due ?? []) {
    const { data: devices } = await supabase
      .from('app_push_devices')
      .select('expo_push_token')
      .eq('app_id', m.app_id)
      .is('revoked_at', null)
    const tokens = (devices ?? []).map((d) => d.expo_push_token)
    if (tokens.length === 0) {
      await supabase
        .from('app_push_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipient_count: 0,
          delivered_count: 0,
          failed_count: 0,
          error: 'No active devices',
        })
        .eq('id', m.id)
      processed += 1
      continue
    }
    const payload: ExpoPushMessage[] = tokens.map((to) => ({
      to,
      title: m.title,
      body: m.body,
      sound: 'default',
      data: (m.data as Record<string, unknown>) ?? {},
    }))
    await supabase.from('app_push_messages').update({ status: 'sending' }).eq('id', m.id)
    const result = await sendExpoPush(payload)
    await supabase
      .from('app_push_messages')
      .update({
        status: result.ok ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
        recipient_count: tokens.length,
        delivered_count: result.delivered,
        failed_count: result.failed,
        expo_ticket_ids: result.tickets.map((t) => ({ status: t.status, id: t.id ?? null })),
        error: result.error ?? null,
      })
      .eq('id', m.id)
    processed += 1
  }

  return NextResponse.json({ processed })
}
