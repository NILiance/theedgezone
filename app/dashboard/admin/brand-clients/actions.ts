'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { env } from '@/lib/env'

const upsertSchema = z.object({
  client_id: z.string().uuid().optional(),
  name: z.string().min(2).max(160),
  contact_email: z.string().email().max(160),
  company: z.string().max(160).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(['active', 'archived']).default('active'),
})

export async function upsertBrandClient(
  formData: FormData
): Promise<{ ok: boolean; message?: string; client_id?: string }> {
  await requireAdmin()
  const parsed = upsertSchema.safeParse({
    client_id: formData.get('client_id') || undefined,
    name: formData.get('name'),
    contact_email: formData.get('contact_email'),
    company: formData.get('company') || undefined,
    notes: formData.get('notes') || undefined,
    status: formData.get('status') || 'active',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  const row = {
    name: parsed.data.name,
    contact_email: parsed.data.contact_email.toLowerCase(),
    company: parsed.data.company ?? null,
    notes: parsed.data.notes ?? null,
    status: parsed.data.status,
  }

  if (parsed.data.client_id) {
    const { error } = await supabase.from('brand_clients').update(row).eq('id', parsed.data.client_id)
    if (error) return { ok: false, message: error.message }
    revalidatePath('/dashboard/admin/brand-clients')
    return { ok: true, client_id: parsed.data.client_id }
  } else {
    const { data, error } = await supabase
      .from('brand_clients')
      .insert(row)
      .select('id')
      .single()
    if (error || !data) {
      return {
        ok: false,
        message: error?.message?.toLowerCase().includes('duplicate')
          ? 'A client with that email already exists.'
          : error?.message ?? 'Insert failed',
      }
    }
    revalidatePath('/dashboard/admin/brand-clients')
    return { ok: true, client_id: data.id as string }
  }
}

const deleteSchema = z.object({ client_id: z.string().uuid() })
export async function deleteBrandClient(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = deleteSchema.safeParse({ client_id: formData.get('client_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  await supabase.from('brand_clients').delete().eq('id', parsed.data.client_id)
  revalidatePath('/dashboard/admin/brand-clients')
  return { ok: true }
}

function generateToken(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

const sendMagicLinkSchema = z.object({
  client_id: z.string().uuid(),
  ttl_days: z.coerce.number().int().min(1).max(180).default(14),
})

export async function sendBrandClientMagicLink(
  formData: FormData
): Promise<{ ok: boolean; url?: string; message?: string }> {
  await requireAdmin()
  const parsed = sendMagicLinkSchema.safeParse({
    client_id: formData.get('client_id'),
    ttl_days: formData.get('ttl_days') ?? 14,
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  const { data: client } = await supabase
    .from('brand_clients')
    .select('id, name, contact_email, status')
    .eq('id', parsed.data.client_id)
    .single()
  if (!client || client.status !== 'active') return { ok: false, message: 'Client not active' }

  const token = generateToken()
  const expiresAt = new Date(Date.now() + parsed.data.ttl_days * 24 * 3600 * 1000).toISOString()
  await supabase.from('brand_client_tokens').insert({
    token,
    brand_client_id: parsed.data.client_id,
    expires_at: expiresAt,
  })

  const base = env.NEXT_PUBLIC_SITE_URL ?? 'https://theedgezone.vercel.app'
  const url = `${base}/brand/${token}`

  await sendEmail({
    to: client.contact_email,
    subject: 'Your Edge Zone brand portal access',
    html: `
      <p style="margin:0 0 16px 0;font:14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">
        Hey ${client.name},
      </p>
      <p style="margin:0 0 16px 0;font:14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">
        Your brand portal is ready. Click the link below to log in — no password needed.
      </p>
      <p style="margin:0 0 24px 0">
        <a href="${url}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font:bold 12px/1 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;letter-spacing:1px;text-transform:uppercase">
          Open my brand portal →
        </a>
      </p>
      <p style="margin:0;color:#888;font:12px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">
        Link expires in ${parsed.data.ttl_days} days. You can request a new one any time.
      </p>
    `,
    templateKey: 'brand_client_magic_link',
    metadata: { brand_client_id: client.id },
  })

  return { ok: true, url }
}

const uploadAssetSchema = z.object({
  client_id: z.string().uuid(),
  kind: z.enum(['file', 'image', 'pdf', 'brand_kit_zip', 'other']).default('file'),
  filename: z.string().max(200),
  url: z.string().url().max(1000),
  size_bytes: z.coerce.number().int().min(0).optional(),
  description: z.string().max(1000).optional(),
})

export async function uploadBrandClientAsset(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = uploadAssetSchema.safeParse({
    client_id: formData.get('client_id'),
    kind: formData.get('kind') || 'file',
    filename: formData.get('filename'),
    url: formData.get('url'),
    size_bytes: formData.get('size_bytes') ?? undefined,
    description: formData.get('description') || undefined,
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  await supabase.from('brand_client_assets').insert({
    brand_client_id: parsed.data.client_id,
    kind: parsed.data.kind,
    filename: parsed.data.filename,
    url: parsed.data.url,
    size_bytes: parsed.data.size_bytes ?? null,
    description: parsed.data.description ?? null,
  })
  revalidatePath(`/dashboard/admin/brand-clients/${parsed.data.client_id}`)
  return { ok: true }
}

const deleteAssetSchema = z.object({ asset_id: z.string().uuid() })
export async function deleteBrandClientAsset(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = deleteAssetSchema.safeParse({ asset_id: formData.get('asset_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  const { data: row } = await supabase
    .from('brand_client_assets')
    .select('id, brand_client_id')
    .eq('id', parsed.data.asset_id)
    .single()
  if (row?.brand_client_id) {
    await supabase.from('brand_client_assets').delete().eq('id', parsed.data.asset_id)
    revalidatePath(`/dashboard/admin/brand-clients/${row.brand_client_id}`)
  }
  return { ok: true }
}
