'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const PATH = '/dashboard/admin/setup'

export async function upsertSetupTask(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }

  const id = String(formData.get('id') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { ok: false, message: 'Title is required' }
  const row = {
    title,
    detail: String(formData.get('detail') ?? '').trim() || null,
    category: String(formData.get('category') ?? 'general').trim() || 'general',
    env_var: String(formData.get('env_var') ?? '').trim() || null,
    link: String(formData.get('link') ?? '').trim() || null,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await supabase.from('setup_tasks').update(row).eq('id', id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase
      .from('setup_tasks')
      .insert({ ...row, status: 'todo', sort_order: 200 })
    if (error) return { ok: false, message: error.message }
  }
  revalidatePath(PATH)
  return { ok: true }
}

export async function setSetupTaskStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }
  const { error } = await supabase
    .from('setup_tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

export async function deleteSetupTask(id: string): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }
  const { error } = await supabase.from('setup_tasks').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(PATH)
  return { ok: true }
}
