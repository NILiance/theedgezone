import { Resend } from 'resend'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'

let resendClient: Resend | null = null

function client(): Resend | null {
  if (!env.RESEND_API_KEY) return null
  if (!resendClient) resendClient = new Resend(env.RESEND_API_KEY)
  return resendClient
}

interface SendArgs {
  to: string
  subject: string
  html: string
  templateKey?: string
  metadata?: Record<string, unknown>
}

interface SendResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Sends an email via Resend and writes a row to the email_log table.
 * Logging requires SUPABASE_SERVICE_ROLE_KEY; if absent, the email is still
 * sent (if Resend is configured) but not logged.
 *
 * Designed to be called fire-and-forget (`void sendEmail(...)`) from server
 * actions so the user's response isn't blocked by email delivery.
 */
export async function sendEmail({
  to,
  subject,
  html,
  templateKey,
  metadata,
}: SendArgs): Promise<SendResult> {
  const from = env.RESEND_FROM_EMAIL ?? 'noreply@theedgezone.com'
  const r = client()

  let logId: string | null = null
  let supabase: ReturnType<typeof createServiceClient> = null
  try {
    supabase = createServiceClient()
    if (!supabase) throw new Error('no service client')
    const { data } = await supabase
      .from('email_log')
      .insert({
        to_address: to,
        from_address: from,
        subject,
        template_key: templateKey ?? null,
        metadata: metadata ?? null,
        status: 'queued',
      })
      .select('id')
      .single()
    logId = data?.id ?? null
  } catch {
    // Service role not configured — proceed without logging.
  }

  if (!r) {
    if (supabase && logId) {
      await supabase
        .from('email_log')
        .update({ status: 'failed', error: 'RESEND_API_KEY not configured' })
        .eq('id', logId)
    }
    return { success: false, error: 'Resend not configured' }
  }

  try {
    const { data, error } = await r.emails.send({ from, to, subject, html })
    if (error) {
      if (supabase && logId) {
        await supabase
          .from('email_log')
          .update({ status: 'failed', error: error.message })
          .eq('id', logId)
      }
      return { success: false, error: error.message }
    }
    if (supabase && logId) {
      await supabase
        .from('email_log')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_id: data?.id ?? null,
        })
        .eq('id', logId)
    }
    return { success: true, id: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (supabase && logId) {
      await supabase
        .from('email_log')
        .update({ status: 'failed', error: msg })
        .eq('id', logId)
    }
    return { success: false, error: msg }
  }
}
