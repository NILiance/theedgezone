'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { provisionStore } from '@/lib/provisioning'
import { composeMockup } from '@/lib/store-mockup'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export async function createStore() {
  const user = await requireUser()
  const supabase = await createClient()
  const result = await provisionStore(supabase, user.id)
  if (!result.entity_id) throw new Error('Failed to create store')
  redirect(`/dashboard/stores/${result.entity_id}`)
}

const storeSettingsSchema = z.object({
  store_id: z.string().uuid(),
  name: z.string().min(2).max(160),
  tagline: z.string().max(240).optional(),
  description: z.string().max(2000).optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hero_image_url: z.string().url().max(800).optional(),
  logo_url: z.string().url().max(800).optional(),
  contact_email: z.string().email().max(160).optional(),
  status: z.enum(['draft', 'open', 'paused', 'archived']).default('draft'),
})

export async function updateStoreSettings(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = storeSettingsSchema.safeParse({
    store_id: formData.get('store_id'),
    name: formData.get('name'),
    tagline: formData.get('tagline') || undefined,
    description: formData.get('description') || undefined,
    primary_color: formData.get('primary_color'),
    secondary_color: formData.get('secondary_color'),
    hero_image_url: formData.get('hero_image_url') || undefined,
    logo_url: formData.get('logo_url') || undefined,
    contact_email: formData.get('contact_email') || undefined,
    status: formData.get('status') || 'draft',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('stores')
    .update({
      name: parsed.data.name,
      tagline: parsed.data.tagline ?? null,
      description: parsed.data.description ?? null,
      primary_color: parsed.data.primary_color,
      secondary_color: parsed.data.secondary_color,
      hero_image_url: parsed.data.hero_image_url ?? null,
      logo_url: parsed.data.logo_url ?? null,
      contact_email: parsed.data.contact_email ?? null,
      status: parsed.data.status,
    })
    .eq('id', parsed.data.store_id)
    .eq('user_id', user.id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/dashboard/stores/${parsed.data.store_id}`)
  revalidatePath(`/store/${parsed.data.store_id}`)
  return { ok: true }
}

const productSchema = z.object({
  product_id: z.string().uuid().optional(),
  store_id: z.string().uuid(),
  name: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  price_cents: z.coerce.number().int().min(0).max(10_000_000),
  compare_at_cents: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(10_000_000)])
    .transform((v) => (v === '' ? null : (v as number))),
  inventory: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(10_000_000)])
    .transform((v) => (v === '' ? null : (v as number))),
  cost_cents: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(10_000_000)])
    .transform((v) => (v === '' ? null : (v as number))),
  primary_image_url: z.string().url().max(800).optional(),
  tags: z.string().max(500).optional(),
  variants: z.string().max(20_000).optional(),
  active: z.coerce.boolean().default(true),
})

const variantSchema = z.array(
  z.object({
    size: z.string().max(60).optional(),
    color: z.string().max(60).optional(),
    sku: z.string().max(120).optional(),
    price_cents: z.number().int().min(0).max(10_000_000).nullable().optional(),
    inventory: z.number().int().min(0).max(10_000_000).nullable().optional(),
  })
)

export async function upsertStoreProduct(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = productSchema.safeParse({
    product_id: formData.get('product_id') || undefined,
    store_id: formData.get('store_id'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    price_cents: formData.get('price_cents'),
    compare_at_cents: formData.get('compare_at_cents') ?? '',
    inventory: formData.get('inventory') ?? '',
    cost_cents: formData.get('cost_cents') ?? '',
    primary_image_url: formData.get('primary_image_url') || undefined,
    tags: formData.get('tags') || undefined,
    variants: formData.get('variants') || undefined,
    active: formData.get('active') === 'on' || formData.get('active') === 'true',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  // Parse + validate the variants JSON the editor serialized.
  let variants: Array<Record<string, unknown>> = []
  if (parsed.data.variants) {
    try {
      const v = variantSchema.safeParse(JSON.parse(parsed.data.variants))
      if (v.success) variants = v.data
    } catch {
      /* ignore malformed — treat as no variants */
    }
  }

  const supabase = await createClient()
  // Ownership check
  const { data: store } = await supabase
    .from('stores')
    .select('id, user_id')
    .eq('id', parsed.data.store_id)
    .single()
  if (!store || store.user_id !== user.id) return { ok: false, message: 'Store not found' }

  const slug = slugify(parsed.data.name)
  const tags = parsed.data.tags
    ? parsed.data.tags
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter(Boolean)
    : []

  const row = {
    store_id: parsed.data.store_id,
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? null,
    price_cents: parsed.data.price_cents,
    compare_at_cents: parsed.data.compare_at_cents,
    cost_cents: parsed.data.cost_cents,
    inventory: parsed.data.inventory,
    primary_image_url: parsed.data.primary_image_url ?? null,
    tags,
    variants,
    active: parsed.data.active,
    updated_at: new Date().toISOString(),
  }

  if (parsed.data.product_id) {
    const { error } = await supabase
      .from('store_products')
      .update(row)
      .eq('id', parsed.data.product_id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase.from('store_products').insert(row)
    if (error) {
      return {
        ok: false,
        message: error.message.toLowerCase().includes('duplicate')
          ? 'A product with that name already exists.'
          : error.message,
      }
    }
  }
  revalidatePath(`/dashboard/stores/${parsed.data.store_id}`)
  revalidatePath(`/store/${parsed.data.store_id}`)
  return { ok: true }
}

const deleteProductSchema = z.object({ product_id: z.string().uuid() })
export async function deleteStoreProduct(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = deleteProductSchema.safeParse({ product_id: formData.get('product_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = await createClient()
  const { data: prod } = await supabase
    .from('store_products')
    .select('id, store_id, stores!inner(user_id)')
    .eq('id', parsed.data.product_id)
    .single()
  const ownerId = (prod as { stores?: { user_id?: string } })?.stores?.user_id
  if (!prod || ownerId !== user.id) return { ok: false, message: 'Product not found' }
  await supabase.from('store_products').delete().eq('id', parsed.data.product_id)
  revalidatePath(`/dashboard/stores/${prod.store_id}`)
  revalidatePath(`/store/${prod.store_id}`)
  return { ok: true }
}

// ── POD mockup compositor ────────────────────────────────────────────────────
const mockupSchema = z.object({
  store_id: z.string().uuid(),
  blank_url: z.string().url().max(1000),
  logo_url: z.string().url().max(1000),
  placement: z.enum(['front_chest', 'front_center', 'back']),
  size_pct: z.coerce.number().int().min(10).max(70).default(30),
  knockout_white: z.boolean().default(true),
})

/**
 * Composite the brand logo onto a product blank and return the uploaded PNG
 * URL. The client then uses it as the product image. Logo + blank are fetched
 * server-side (http/https only) and rendered with Sharp.
 */
export async function generateProductMockup(input: {
  store_id: string
  blank_url: string
  logo_url: string
  placement: string
  size_pct: number
  knockout_white: boolean
}): Promise<{ ok: boolean; url?: string; message?: string }> {
  const user = await requireUser()
  const parsed = mockupSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('id, user_id')
    .eq('id', parsed.data.store_id)
    .single()
  if (!store || store.user_id !== user.id) return { ok: false, message: 'Store not found' }

  const fetchImage = async (url: string): Promise<Buffer | null> => {
    if (!/^https?:\/\//i.test(url)) return null
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer())
    } catch {
      return null
    }
  }
  const [blankBuffer, logoBuffer] = await Promise.all([
    fetchImage(parsed.data.blank_url),
    fetchImage(parsed.data.logo_url),
  ])
  if (!blankBuffer) return { ok: false, message: 'Could not load the product blank image.' }
  if (!logoBuffer) return { ok: false, message: 'Could not load the logo image.' }

  let png: Buffer
  try {
    png = await composeMockup({
      blankBuffer,
      logoBuffer,
      placement: parsed.data.placement,
      sizePct: parsed.data.size_pct,
      knockoutWhite: parsed.data.knockout_white,
    })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Mockup render failed' }
  }

  const path = `${user.id}/store-mockups/${store.id}/mockup-${Date.now()}.png`
  const { error: upErr } = await supabase.storage
    .from('site-assets')
    .upload(path, png, { contentType: 'image/png', upsert: true })
  if (upErr) return { ok: false, message: upErr.message }
  const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
  return { ok: true, url: pub.publicUrl }
}
