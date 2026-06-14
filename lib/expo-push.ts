/**
 * Thin wrapper over the Expo Push API.
 *
 * Expo provides a free push relay that routes to APNS (iOS) + FCM (Android)
 * — talents don't have to provision Firebase credentials per-app. We POST
 * up to 100 messages per request to https://exp.host/--/api/v2/push/send
 * and Expo returns one ticket per message which we persist.
 *
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

export interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
  channelId?: string
  priority?: 'default' | 'normal' | 'high'
  ttl?: number
}

export interface ExpoPushTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

const ENDPOINT = 'https://exp.host/--/api/v2/push/send'
const BATCH_SIZE = 100

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<{
  ok: boolean
  tickets: ExpoPushTicket[]
  delivered: number
  failed: number
  error?: string
}> {
  if (messages.length === 0) {
    return { ok: true, tickets: [], delivered: 0, failed: 0 }
  }
  const tickets: ExpoPushTicket[] = []
  let delivered = 0
  let failed = 0

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE)
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'accept-encoding': 'gzip, deflate',
          'content-type': 'application/json',
        },
        body: JSON.stringify(batch),
      })
      if (!res.ok) {
        const text = await res.text()
        return {
          ok: false,
          tickets,
          delivered,
          failed: failed + batch.length,
          error: `Expo Push HTTP ${res.status}: ${text.slice(0, 200)}`,
        }
      }
      const json = (await res.json()) as { data?: ExpoPushTicket[]; errors?: unknown }
      if (Array.isArray(json.data)) {
        for (const t of json.data) {
          tickets.push(t)
          if (t.status === 'ok') delivered += 1
          else failed += 1
        }
      } else {
        failed += batch.length
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown push error'
      return { ok: false, tickets, delivered, failed: failed + batch.length, error: msg }
    }
  }

  return { ok: true, tickets, delivered, failed }
}

export function isValidExpoToken(token: string): boolean {
  return /^ExponentPushToken\[[^\]]+\]$/.test(token) || /^ExpoPushToken\[[^\]]+\]$/.test(token)
}
