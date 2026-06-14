'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendExpoPush, type ExpoPushMessage } from '@/lib/expo-push'

export type PushState = { ok?: boolean; error?: string; messageId?: string; delivered?: number; failed?: number }

async function assertOwner(appId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('id, user_id')
    .eq('id', appId)
    .single()
  if (!app || app.user_id !== user.id) return { ok: false, error: 'Not your app' }
  return { ok: true }
}

export async function composePushMessage(_prev: PushState, form: FormData): Promise<PushState> {
  const user = await requireUser()
  const appId = String(form.get('app_id') ?? '')
  const title = String(form.get('title') ?? '').trim()
  const body = String(form.get('body') ?? '').trim()
  const scheduleRaw = String(form.get('scheduled_for') ?? '').trim()
  const sendNow = form.get('send_now') === 'on'
  const dataRaw = String(form.get('data') ?? '').trim()

  if (!appId) return { error: 'Missing app id' }
  if (!title) return { error: 'Title is required' }
  if (!body) return { error: 'Body is required' }
  if (title.length > 100) return { error: 'Title is too long' }
  if (body.length > 240) return { error: 'Body is too long' }

  const own = await assertOwner(appId)
  if (!own.ok) return { error: own.error }

  let data: Record<string, unknown> = {}
  if (dataRaw) {
    try {
      const parsed = JSON.parse(dataRaw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>
      }
    } catch {
      return { error: 'Extra data must be valid JSON object' }
    }
  }

  const supabase = await createClient()
  const status = sendNow ? 'sending' : scheduleRaw ? 'scheduled' : 'draft'
  const scheduledFor = scheduleRaw ? new Date(scheduleRaw).toISOString() : null

  const { data: row, error } = await supabase
    .from('app_push_messages')
    .insert({
      app_id: appId,
      title,
      body,
      data,
      status,
      scheduled_for: scheduledFor,
      created_by: user.id,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  if (sendNow) {
    const result = await deliverMessageInternal(row.id, appId)
    if (!result.ok) return { error: result.error }
    revalidatePath(`/dashboard/apps/${appId}/push`)
    return { ok: true, messageId: row.id, delivered: result.delivered, failed: result.failed }
  }
  revalidatePath(`/dashboard/apps/${appId}/push`)
  return { ok: true, messageId: row.id }
}

export async function sendPushMessage(_prev: PushState, form: FormData): Promise<PushState> {
  const appId = String(form.get('app_id') ?? '')
  const messageId = String(form.get('message_id') ?? '')
  if (!appId || !messageId) return { error: 'Missing id' }
  const own = await assertOwner(appId)
  if (!own.ok) return { error: own.error }
  const result = await deliverMessageInternal(messageId, appId)
  if (!result.ok) return { error: result.error }
  revalidatePath(`/dashboard/apps/${appId}/push`)
  return { ok: true, delivered: result.delivered, failed: result.failed }
}

export async function cancelPushMessage(_prev: PushState, form: FormData): Promise<PushState> {
  const appId = String(form.get('app_id') ?? '')
  const messageId = String(form.get('message_id') ?? '')
  if (!appId || !messageId) return { error: 'Missing id' }
  const own = await assertOwner(appId)
  if (!own.ok) return { error: own.error }
  const supabase = await createClient()
  const { error } = await supabase
    .from('app_push_messages')
    .update({ status: 'cancelled' })
    .eq('id', messageId)
    .in('status', ['draft', 'scheduled'])
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/apps/${appId}/push`)
  return { ok: true }
}

async function deliverMessageInternal(
  messageId: string,
  appId: string
): Promise<{ ok: true; delivered: number; failed: number } | { ok: false; error: string }> {
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, error: 'Service role key missing' }

  const { data: message } = await supabase
    .from('app_push_messages')
    .select('title, body, data, status')
    .eq('id', messageId)
    .single()
  if (!message) return { ok: false, error: 'Message not found' }
  if (message.status === 'sent') return { ok: true, delivered: 0, failed: 0 }

  const { data: devices } = await supabase
    .from('app_push_devices')
    .select('expo_push_token')
    .eq('app_id', appId)
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
      .eq('id', messageId)
    return { ok: true, delivered: 0, failed: 0 }
  }

  const payload: ExpoPushMessage[] = tokens.map((to) => ({
    to,
    title: message.title,
    body: message.body,
    sound: 'default',
    data: (message.data as Record<string, unknown>) ?? {},
  }))

  await supabase.from('app_push_messages').update({ status: 'sending' }).eq('id', messageId)
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
    .eq('id', messageId)

  if (!result.ok) return { ok: false, error: result.error ?? 'Unknown send failure' }
  return { ok: true, delivered: result.delivered, failed: result.failed }
}
