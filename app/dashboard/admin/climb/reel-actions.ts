'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Save the singleton Platform Reel — the ordered set of milestone videos
 * that play back-to-back on /path-to-the-summit/reel.
 */
export async function saveClimbReel(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }

  const title = String(formData.get('title') ?? '').trim() || 'Path to the Summit'
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null
  const published = formData.get('published') === 'on' || formData.get('published') === 'true'

  let milestoneIds: string[] = []
  try {
    const raw = JSON.parse(String(formData.get('milestone_ids') ?? '[]'))
    if (Array.isArray(raw)) milestoneIds = raw.filter((x): x is string => typeof x === 'string')
  } catch {
    return { ok: false, message: 'Could not read the reel order.' }
  }

  const { error } = await supabase
    .from('climb_reel')
    .update({
      title,
      subtitle,
      milestone_ids: milestoneIds,
      published,
      updated_at: new Date().toISOString(),
    })
    .eq('singleton', true)
  if (error) return { ok: false, message: error.message }

  revalidatePath('/dashboard/admin/climb')
  revalidatePath('/path-to-the-summit/reel')
  return { ok: true }
}
