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

const phaseSchema = z.object({
  phase_id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  icon: z.string().max(4).optional(),
  position: z.coerce.number().int().min(0).max(50).default(0),
  published: z.coerce.boolean().default(true),
})

export async function upsertPhase(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = phaseSchema.safeParse({
    phase_id: formData.get('phase_id') || undefined,
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    icon: formData.get('icon') || undefined,
    position: formData.get('position') ?? 0,
    published: formData.get('published') === 'on' || formData.get('published') === 'true',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  const row = {
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description ?? null,
    icon: parsed.data.icon ?? null,
    position: parsed.data.position,
    published: parsed.data.published,
  }

  if (parsed.data.phase_id) {
    const { error } = await supabase
      .from('roadmap_phases')
      .update(row)
      .eq('id', parsed.data.phase_id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase.from('roadmap_phases').insert(row)
    if (error)
      return {
        ok: false,
        message: error.message.toLowerCase().includes('duplicate')
          ? 'A phase with that name already exists.'
          : error.message,
      }
  }
  revalidatePath('/dashboard/admin/roadmap')
  revalidatePath('/roadmap')
  return { ok: true }
}

const deletePhaseSchema = z.object({ phase_id: z.string().uuid() })
export async function deletePhase(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = deletePhaseSchema.safeParse({ phase_id: formData.get('phase_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  await supabase.from('roadmap_phases').delete().eq('id', parsed.data.phase_id)
  revalidatePath('/dashboard/admin/roadmap')
  revalidatePath('/roadmap')
  return { ok: true }
}

const itemSchema = z.object({
  item_id: z.string().uuid().optional(),
  phase_id: z.string().uuid(),
  name: z.string().min(2).max(180),
  description: z.string().max(2000).optional(),
  audience: z.enum(['all', 'talent', 'brand']).default('all'),
  position: z.coerce.number().int().min(0).max(100).default(0),
  recommended_action_url: z.string().max(500).optional(),
  recommended_action_label: z.string().max(80).optional(),
  published: z.coerce.boolean().default(true),
})

export async function upsertItem(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = itemSchema.safeParse({
    item_id: formData.get('item_id') || undefined,
    phase_id: formData.get('phase_id'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    audience: formData.get('audience') || 'all',
    position: formData.get('position') ?? 0,
    recommended_action_url: formData.get('recommended_action_url') || undefined,
    recommended_action_label: formData.get('recommended_action_label') || undefined,
    published: formData.get('published') === 'on' || formData.get('published') === 'true',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  const row = {
    phase_id: parsed.data.phase_id,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description ?? null,
    audience: parsed.data.audience,
    position: parsed.data.position,
    recommended_action_url: parsed.data.recommended_action_url ?? null,
    recommended_action_label: parsed.data.recommended_action_label ?? null,
    published: parsed.data.published,
    updated_at: new Date().toISOString(),
  }

  if (parsed.data.item_id) {
    const { error } = await supabase
      .from('roadmap_items')
      .update(row)
      .eq('id', parsed.data.item_id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase.from('roadmap_items').insert(row)
    if (error)
      return {
        ok: false,
        message: error.message.toLowerCase().includes('duplicate')
          ? 'An item with that name already exists.'
          : error.message,
      }
  }
  revalidatePath('/dashboard/admin/roadmap')
  revalidatePath('/roadmap')
  revalidatePath('/dashboard/roadmap')
  return { ok: true }
}

const deleteItemSchema = z.object({ item_id: z.string().uuid() })
export async function deleteItem(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = deleteItemSchema.safeParse({ item_id: formData.get('item_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  await supabase.from('roadmap_items').delete().eq('id', parsed.data.item_id)
  revalidatePath('/dashboard/admin/roadmap')
  revalidatePath('/roadmap')
  return { ok: true }
}
