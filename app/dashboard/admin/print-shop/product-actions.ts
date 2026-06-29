'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/provisioning'

const CATEGORIES = [
  'banner',
  'business_card',
  'flyer',
  'poster',
  'sticker',
  'apparel',
  'signage',
  'other',
]

/**
 * Create or update a Print Shop product (admin only). Handles an optional cover
 * image upload. Pricing is entered in dollars and stored as cents.
 */
export async function upsertPrintProduct(form: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')

  const id = String(form.get('id') ?? '').trim()
  const name = String(form.get('name') ?? '').trim()
  if (!name) throw new Error('Product name is required')
  const slug = String(form.get('slug') ?? '').trim() || slugify(name)
  const description = String(form.get('description') ?? '').trim() || null
  const categoryRaw = String(form.get('category') ?? 'other')
  const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : 'other'
  const basePriceCents = Math.max(1, Math.round(Number(form.get('base_price') ?? 0) * 100))
  const leadTimeDays = Math.max(0, Math.round(Number(form.get('lead_time_days') ?? 7) || 7))
  const active = form.get('active') === 'on' || form.get('active') === '1'
  const position = Math.round(Number(form.get('position') ?? 0)) || 0

  // Optional cover image — upload to storage, else keep the existing URL.
  let coverUrl = String(form.get('cover_image_url') ?? '').trim() || null
  const file = form.get('cover_image')
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) throw new Error('Image too large — max 10MB.')
    const buf = Buffer.from(await file.arrayBuffer())
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `print-products/${slug}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('brand-assets')
      .upload(path, new Uint8Array(buf), { contentType: file.type || 'image/png', upsert: true })
    if (upErr) throw new Error(`Cover upload failed: ${upErr.message}`)
    coverUrl = supabase.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
  }

  const row: Record<string, unknown> = {
    name,
    slug,
    description,
    category,
    base_price_cents: basePriceCents,
    lead_time_days: leadTimeDays,
    active,
    position,
    updated_at: new Date().toISOString(),
  }
  if (coverUrl) row.cover_image_url = coverUrl

  // Per-product logo placement (catalog overlay).
  const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5)
  row.logo_x = clamp01(Number(form.get('logo_x') ?? 0.5))
  row.logo_y = clamp01(Number(form.get('logo_y') ?? 0.5))
  row.logo_scale = Math.max(0.05, Math.min(0.95, Number(form.get('logo_scale') ?? 0.3) || 0.3))

  const write = (r: Record<string, unknown>) =>
    id
      ? supabase.from('print_products').update(r).eq('id', id)
      : supabase.from('print_products').insert(r)

  let res = await write(row)
  if (res.error && /logo_(x|y|scale)|column/i.test(res.error.message)) {
    // Placement migration not applied yet — save the rest.
    const { logo_x, logo_y, logo_scale, ...rest } = row
    void logo_x
    void logo_y
    void logo_scale
    res = await write(rest)
  }
  if (res.error) throw new Error(res.error.message)
  revalidatePath('/dashboard/admin/print-shop/products')
}

/** Delete a product (admin only). */
export async function deletePrintProduct(form: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const id = String(form.get('id') ?? '').trim()
  if (id) {
    const { error } = await supabase.from('print_products').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
  revalidatePath('/dashboard/admin/print-shop/products')
}
