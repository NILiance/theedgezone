'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { env } from '@/lib/env'

const csvRowSchema = z.object({
  email: z.string().email().max(160),
  name: z.string().max(120).optional(),
  sport: z.string().max(80).optional(),
  school: z.string().max(160).optional(),
  programs: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})

function parseCsv(raw: string): Array<{ email: string; name?: string; sport?: string; school?: string; programs?: string; notes?: string }> {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return []
  const headerLine = lines[0]!.toLowerCase()
  const headers = headerLine.split(',').map((h) => h.trim().replace(/"/g, ''))
  const rows: ReturnType<typeof parseCsv> = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? '').trim()
    })
    if (row.email) rows.push(row as ReturnType<typeof parseCsv>[number])
  }
  return rows
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV splitter — handles quoted fields with embedded commas.
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else cur += c
    } else {
      if (c === ',') {
        out.push(cur)
        cur = ''
      } else if (c === '"') inQuotes = true
      else cur += c
    }
  }
  out.push(cur)
  return out
}

const uploadCsvSchema = z.object({ csv: z.string().min(5).max(2_000_000) })

export async function uploadEnrollmentCsv(
  formData: FormData
): Promise<{ ok: boolean; inserted?: number; skipped?: number; message?: string }> {
  await requireAdmin()
  const parsed = uploadCsvSchema.safeParse({ csv: formData.get('csv') })
  if (!parsed.success) return { ok: false, message: 'Paste at least a header + one row.' }

  const rows = parseCsv(parsed.data.csv)
  if (rows.length === 0) return { ok: false, message: 'No rows parsed.' }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing on the deploy.' }

  let inserted = 0
  let skipped = 0
  for (const r of rows) {
    const v = csvRowSchema.safeParse(r)
    if (!v.success) {
      skipped++
      continue
    }
    const { error } = await supabase.from('enrollment_invitations').insert({
      email: v.data.email.toLowerCase(),
      display_name: v.data.name ?? null,
      sport: v.data.sport ?? null,
      school: v.data.school ?? null,
      programs: v.data.programs
        ? v.data.programs.split(/[;|]/).map((p) => p.trim()).filter(Boolean)
        : [],
      notes: v.data.notes ?? null,
    })
    if (error) {
      if (error.message.toLowerCase().includes('duplicate')) skipped++
      else skipped++
    } else inserted++
  }

  revalidatePath('/dashboard/admin/enrollment')
  return { ok: true, inserted, skipped }
}

const manualSchema = z.object({
  email: z.string().email().max(160),
  display_name: z.string().max(120).optional(),
  sport: z.string().max(80).optional(),
  school: z.string().max(160).optional(),
  programs: z.string().max(500).optional(),
})

export async function addManualEnrollment(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = manualSchema.safeParse({
    email: formData.get('email'),
    display_name: formData.get('display_name') || undefined,
    sport: formData.get('sport') || undefined,
    school: formData.get('school') || undefined,
    programs: formData.get('programs') || undefined,
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }
  const { error } = await supabase.from('enrollment_invitations').insert({
    email: parsed.data.email.toLowerCase(),
    display_name: parsed.data.display_name ?? null,
    sport: parsed.data.sport ?? null,
    school: parsed.data.school ?? null,
    programs: parsed.data.programs
      ? parsed.data.programs.split(/[;|,]/).map((p) => p.trim()).filter(Boolean)
      : [],
  })
  if (error) return { ok: false, message: error.message }
  revalidatePath('/dashboard/admin/enrollment')
  return { ok: true }
}

const removeSchema = z.object({ invitation_id: z.string().uuid() })
export async function removeInvitation(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = removeSchema.safeParse({ invitation_id: formData.get('invitation_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }
  await supabase.from('enrollment_invitations').delete().eq('id', parsed.data.invitation_id)
  revalidatePath('/dashboard/admin/enrollment')
  return { ok: true }
}

const templateSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(20).max(20_000),
  reply_to: z.string().email().max(160).optional(),
})

export async function saveEnrollmentTemplate(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = templateSchema.safeParse({
    subject: formData.get('subject'),
    body: formData.get('body'),
    reply_to: formData.get('reply_to') || undefined,
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }
  await supabase
    .from('enrollment_template')
    .upsert({ id: 1, subject: parsed.data.subject, body: parsed.data.body, reply_to: parsed.data.reply_to ?? null })
  revalidatePath('/dashboard/admin/enrollment')
  return { ok: true }
}

const sendSchema = z.object({
  scope: z.enum(['all_pending', 'selected']),
  invitation_ids: z.string().optional(),
})

export async function sendEnrollmentBatch(
  formData: FormData
): Promise<{ ok: boolean; sent?: number; failed?: number; message?: string }> {
  await requireAdmin()
  const parsed = sendSchema.safeParse({
    scope: formData.get('scope') || 'all_pending',
    invitation_ids: formData.get('invitation_ids') || undefined,
  })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }

  const { data: template } = await supabase
    .from('enrollment_template')
    .select('subject, body, reply_to')
    .eq('id', 1)
    .single()
  if (!template) return { ok: false, message: 'Template not configured.' }

  let query = supabase
    .from('enrollment_invitations')
    .select('id, email, display_name, sport, school, programs, status')
    .in('status', ['pending', 'failed'])
  if (parsed.data.scope === 'selected' && parsed.data.invitation_ids) {
    const ids = parsed.data.invitation_ids.split(',').filter(Boolean)
    if (ids.length === 0) return { ok: false, message: 'No recipients selected.' }
    query = supabase
      .from('enrollment_invitations')
      .select('id, email, display_name, sport, school, programs, status')
      .in('id', ids)
  }
  const { data: recipients } = await query
  if (!recipients || recipients.length === 0) {
    return { ok: false, message: 'No matching recipients.' }
  }

  const base = env.NEXT_PUBLIC_SITE_URL ?? 'https://theedgezone.vercel.app'
  let sent = 0
  let failed = 0

  for (const r of recipients) {
    const loginUrl = `${base}/sign-up?email=${encodeURIComponent(r.email)}&invite=${r.id}`
    const subject = renderTemplate(template.subject, r, loginUrl)
    const bodyText = renderTemplate(template.body, r, loginUrl)
    const html = bodyText
      .split('\n\n')
      .map(
        (p) =>
          `<p style="margin:0 0 16px 0;font:14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#222">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`
      )
      .join('\n')

    const res = await sendEmail({
      to: r.email,
      subject,
      html,
      templateKey: 'enrollment_invitation',
      metadata: { invitation_id: r.id },
    })
    if (res.success) {
      sent++
      await supabase
        .from('enrollment_invitations')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_id: res.id ?? null,
        })
        .eq('id', r.id)
    } else {
      failed++
      await supabase
        .from('enrollment_invitations')
        .update({
          status: 'failed',
          failure_message: res.error ?? 'Unknown',
        })
        .eq('id', r.id)
    }
  }

  revalidatePath('/dashboard/admin/enrollment')
  return { ok: true, sent, failed }
}

function renderTemplate(
  text: string,
  r: { email: string; display_name: string | null; sport: string | null; school: string | null; programs: string[] | null },
  loginUrl: string
): string {
  return text
    .replaceAll('{NAME}', r.display_name ?? 'there')
    .replaceAll('{EMAIL}', r.email)
    .replaceAll('{SPORT}', r.sport ?? '')
    .replaceAll('{SCHOOL}', r.school ?? '')
    .replaceAll('{PROGRAMS}', (r.programs ?? []).join(', '))
    .replaceAll('{LOGIN_URL}', loginUrl)
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  )
}
