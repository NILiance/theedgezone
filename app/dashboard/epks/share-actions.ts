'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { formatEasternDate } from '@/lib/format-date'

export type ShareLinkState = { ok?: boolean; error?: string; token?: string }

function makeToken(): string {
  return randomBytes(18).toString('base64url')
}

export async function createEpkShareLink(
  _prev: ShareLinkState,
  form: FormData
): Promise<ShareLinkState> {
  const user = await requireUser()
  const supabase = await createClient()
  const epkId = String(form.get('epk_id') ?? '')
  if (!epkId) return { error: 'Missing EPK id' }
  const label = String(form.get('label') ?? '').trim() || null
  const recipient = String(form.get('recipient_email') ?? '').trim() || null
  const expiresInDaysRaw = String(form.get('expires_in_days') ?? '').trim()
  const expiresInDays = expiresInDaysRaw === '' ? null : Math.max(1, Math.min(365, Number(expiresInDaysRaw)))

  const { data: epk } = await supabase
    .from('epks')
    .select('id, user_id, display_name, slug')
    .eq('id', epkId)
    .single()
  if (!epk || epk.user_id !== user.id) return { error: 'Not your EPK' }

  let token = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const t = makeToken()
    const { data: existing } = await supabase
      .from('epk_share_links')
      .select('id')
      .eq('token', t)
      .maybeSingle()
    if (!existing) {
      token = t
      break
    }
  }
  if (!token) return { error: 'Could not allocate token' }

  const expiresAt =
    expiresInDays != null
      ? new Date(Date.now() + expiresInDays * 86400_000).toISOString()
      : null

  const { error } = await supabase.from('epk_share_links').insert({
    epk_id: epkId,
    token,
    label,
    created_by: user.id,
    recipient_email: recipient,
    expires_at: expiresAt,
  })
  if (error) return { error: error.message }

  if (recipient) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const link = `${siteUrl}/share/epk/${token}`
    const senderName = epk.display_name ?? 'Edge Zone'
    void sendEmail({
      to: recipient,
      subject: `${senderName} sent you their press kit`,
      html: `<p style="font-family:sans-serif;">${senderName} sent you a press kit.</p>
<p><a href="${link}" style="background:#3aa7ff;color:#0a0e14;padding:10px 18px;border-radius:8px;font-weight:bold;text-decoration:none;font-family:sans-serif;">Open press kit →</a></p>
<p style="font-family:sans-serif;color:#666;font-size:12px;">${link}</p>${
        expiresAt
          ? `<p style="font-family:sans-serif;color:#666;font-size:12px;">Link expires ${formatEasternDate(expiresAt)}.</p>`
          : ''
      }`,
      templateKey: 'epk_share',
      metadata: { epk_id: epkId, token },
    })
  }

  revalidatePath(`/dashboard/epks/${epkId}`)
  return { ok: true, token }
}

export async function revokeEpkShareLink(
  _prev: ShareLinkState,
  form: FormData
): Promise<ShareLinkState> {
  const user = await requireUser()
  const supabase = await createClient()
  const id = String(form.get('share_id') ?? '')
  if (!id) return { error: 'Missing id' }
  const { data: link } = await supabase
    .from('epk_share_links')
    .select('id, created_by, epk_id')
    .eq('id', id)
    .single()
  if (!link || link.created_by !== user.id) return { error: 'Not yours' }
  const { error } = await supabase
    .from('epk_share_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/epks/${link.epk_id}`)
  return { ok: true }
}
