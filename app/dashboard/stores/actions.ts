'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { provisionStore } from '@/lib/provisioning'

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
  primary_image_url: z.string().url().max(800).optional(),
  tags: z.string().max(500).optional(),
  active: z.coerce.boolean().default(true),
})

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
    primary_image_url: formData.get('primary_image_url') || undefined,
    tags: formData.get('tags') || undefined,
    active: formData.get('active') === 'on' || formData.get('active') === 'true',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

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
    inventory: parsed.data.inventory,
    primary_image_url: parsed.data.primary_image_url ?? null,
    tags,
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
