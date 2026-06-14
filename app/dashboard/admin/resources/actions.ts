'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

const upsertSchema = z.object({
  resource_id: z.string().uuid().optional(),
  title: z.string().min(2).max(180),
  slug: z.string().max(80).optional(),
  description: z.string().max(4000).optional(),
  category_id: z.string().uuid().optional(),
  audience: z.enum(['talent', 'brand', 'all']).default('all'),
  file_url: z.string().url().max(500).optional(),
  thumbnail_url: z.string().url().max(500).optional(),
  external_url: z.string().url().max(500).optional(),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
})

export async function upsertResource(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = upsertSchema.safeParse({
    resource_id: formData.get('resource_id') || undefined,
    title: formData.get('title'),
    slug: formData.get('slug') || undefined,
    description: formData.get('description') || undefined,
    category_id: formData.get('category_id') || undefined,
    audience: formData.get('audience') || 'all',
    file_url: formData.get('file_url') || undefined,
    thumbnail_url: formData.get('thumbnail_url') || undefined,
    external_url: formData.get('external_url') || undefined,
    featured: formData.get('featured') === 'on' || formData.get('featured') === 'true',
    published: formData.get('published') === 'on' || formData.get('published') === 'true',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  const slug = parsed.data.slug || slugify(parsed.data.title)

  const row = {
    slug,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    category_id: parsed.data.category_id ?? null,
    audience: parsed.data.audience,
    file_url: parsed.data.file_url ?? null,
    thumbnail_url: parsed.data.thumbnail_url ?? null,
    external_url: parsed.data.external_url ?? null,
    featured: parsed.data.featured,
    published: parsed.data.published,
    updated_at: new Date().toISOString(),
  }

  if (parsed.data.resource_id) {
    const { error } = await supabase
      .from('resources')
      .update(row)
      .eq('id', parsed.data.resource_id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase.from('resources').insert(row)
    if (error) {
      if (error.message.toLowerCase().includes('duplicate')) {
        return { ok: false, message: 'A resource with that slug already exists.' }
      }
      return { ok: false, message: error.message }
    }
  }

  revalidatePath('/dashboard/admin/resources')
  revalidatePath('/resources')
  return { ok: true }
}

const deleteResourceSchema = z.object({ resource_id: z.string().uuid() })
export async function deleteResource(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = deleteResourceSchema.safeParse({ resource_id: formData.get('resource_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  await supabase.from('resources').delete().eq('id', parsed.data.resource_id)
  revalidatePath('/dashboard/admin/resources')
  revalidatePath('/resources')
  return { ok: true }
}

const upsertCategorySchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  icon: z.string().max(8).optional(),
})

export async function upsertCategory(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = upsertCategorySchema.safeParse({
    category_id: formData.get('category_id') || undefined,
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    icon: formData.get('icon') || undefined,
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  const slug = slugify(parsed.data.name)
  const row = {
    slug,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    icon: parsed.data.icon ?? null,
  }

  if (parsed.data.category_id) {
    const { error } = await supabase
      .from('resource_categories')
      .update(row)
      .eq('id', parsed.data.category_id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase.from('resource_categories').insert(row)
    if (error) {
      if (error.message.toLowerCase().includes('duplicate')) {
        return { ok: false, message: 'A category with that name already exists.' }
      }
      return { ok: false, message: error.message }
    }
  }
  revalidatePath('/dashboard/admin/resources')
  revalidatePath('/resources')
  return { ok: true }
}

const deleteCategorySchema = z.object({ category_id: z.string().uuid() })
export async function deleteCategory(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = deleteCategorySchema.safeParse({ category_id: formData.get('category_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  await supabase.from('resource_categories').delete().eq('id', parsed.data.category_id)
  revalidatePath('/dashboard/admin/resources')
  revalidatePath('/resources')
  return { ok: true }
}
