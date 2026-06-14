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
  milestone_id: z.string().uuid().optional(),
  title: z.string().min(2).max(180),
  summary: z.string().max(2000).optional(),
  position: z.coerce.number().int().min(0).max(100).default(0),
  hero_image_url: z.string().url().max(800).optional(),
  video_url: z.string().url().max(800).optional(),
  slides: z.string().optional(),
  cta_label: z.string().max(80).optional(),
  cta_url: z.string().max(500).optional(),
  duration_min: z.coerce.number().int().min(0).max(600).optional(),
  audience: z.enum(['all', 'talent', 'brand']).default('all'),
  published: z.coerce.boolean().default(true),
})

export async function upsertMilestone(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = upsertSchema.safeParse({
    milestone_id: formData.get('milestone_id') || undefined,
    title: formData.get('title'),
    summary: formData.get('summary') || undefined,
    position: formData.get('position') ?? 0,
    hero_image_url: formData.get('hero_image_url') || undefined,
    video_url: formData.get('video_url') || undefined,
    slides: formData.get('slides') || undefined,
    cta_label: formData.get('cta_label') || undefined,
    cta_url: formData.get('cta_url') || undefined,
    duration_min: formData.get('duration_min') || undefined,
    audience: formData.get('audience') || 'all',
    published: formData.get('published') === 'on' || formData.get('published') === 'true',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  let slides: unknown = []
  if (parsed.data.slides) {
    try {
      slides = JSON.parse(parsed.data.slides)
      if (!Array.isArray(slides)) slides = []
    } catch {
      return { ok: false, message: 'Slides must be valid JSON array' }
    }
  }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  const row = {
    title: parsed.data.title,
    slug: slugify(parsed.data.title),
    summary: parsed.data.summary ?? null,
    position: parsed.data.position,
    hero_image_url: parsed.data.hero_image_url ?? null,
    video_url: parsed.data.video_url ?? null,
    slides: slides as Record<string, unknown>[],
    cta_label: parsed.data.cta_label ?? null,
    cta_url: parsed.data.cta_url ?? null,
    duration_min: parsed.data.duration_min ?? null,
    audience: parsed.data.audience,
    published: parsed.data.published,
  }

  if (parsed.data.milestone_id) {
    const { error } = await supabase
      .from('climb_milestones')
      .update(row)
      .eq('id', parsed.data.milestone_id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase.from('climb_milestones').insert(row)
    if (error) {
      return {
        ok: false,
        message: error.message.toLowerCase().includes('duplicate')
          ? 'A milestone with that title already exists.'
          : error.message,
      }
    }
  }
  revalidatePath('/dashboard/admin/climb')
  revalidatePath('/path-to-the-summit')
  revalidatePath('/dashboard/climb')
  return { ok: true }
}

const deleteSchema = z.object({ milestone_id: z.string().uuid() })
export async function deleteMilestone(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = deleteSchema.safeParse({ milestone_id: formData.get('milestone_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  await supabase.from('climb_milestones').delete().eq('id', parsed.data.milestone_id)
  revalidatePath('/dashboard/admin/climb')
  revalidatePath('/path-to-the-summit')
  return { ok: true }
}
