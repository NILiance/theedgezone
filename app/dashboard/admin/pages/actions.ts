'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export type PagesState = { ok?: boolean; error?: string; id?: string }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function createCmsPage(_prev: PagesState, form: FormData): Promise<PagesState> {
  const user = await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const title = String(form.get('title') ?? '').trim()
  if (!title) return { error: 'Title is required' }
  const slug = slugify(String(form.get('slug') ?? '') || title)
  if (!slug) return { error: 'Slug could not be generated' }
  const { data, error } = await supabase
    .from('cms_pages')
    .insert({
      title,
      slug,
      body_md: '',
      status: 'draft',
      created_by: user.id,
      updated_by: user.id,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/pages')
  return { ok: true, id: data.id }
}

export async function deleteCmsPage(_prev: PagesState, form: FormData): Promise<PagesState> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const id = String(form.get('id') ?? '')
  if (!id) return { error: 'Missing id' }
  const { error } = await supabase.from('cms_pages').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/pages')
  return { ok: true }
}
