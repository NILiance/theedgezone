'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export type EditState = { ok?: boolean; error?: string; deleted?: boolean }

export async function saveCmsPage(_prev: EditState, form: FormData): Promise<EditState> {
  const user = await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }

  const id = String(form.get('id') ?? '')
  if (!id) return { error: 'Missing id' }
  const title = String(form.get('title') ?? '').trim()
  const status = String(form.get('status') ?? 'draft')
  const body_md = String(form.get('body_md') ?? '')
  const seo_title = String(form.get('seo_title') ?? '').trim() || null
  const seo_description = String(form.get('seo_description') ?? '').trim() || null

  if (!title) return { error: 'Title is required' }

  const update: Record<string, unknown> = {
    title,
    status,
    body_md,
    seo_title,
    seo_description,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }
  if (status === 'published') {
    update.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from('cms_pages').update(update).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/admin/pages/${id}`)
  revalidatePath('/dashboard/admin/pages')
  return { ok: true }
}

export async function deleteCmsPageFromEdit(_prev: EditState, form: FormData): Promise<EditState> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const id = String(form.get('id') ?? '')
  if (!id) return { error: 'Missing id' }
  const { error } = await supabase.from('cms_pages').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/pages')
  return { deleted: true }
}
