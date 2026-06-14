'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { startHeyGenVideo, getHeyGenStatus, heygenConfigured } from '@/lib/heygen'

export type HeyGenState = { ok?: boolean; error?: string; videoId?: string; status?: string }

export async function startMilestoneVideo(_prev: HeyGenState, form: FormData): Promise<HeyGenState> {
  await requireAdmin()
  if (!heygenConfigured()) return { error: 'HEYGEN_API_KEY not configured' }
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }

  const milestoneId = String(form.get('milestone_id') ?? '')
  const prompt = String(form.get('prompt') ?? '').trim()
  if (!milestoneId) return { error: 'Missing milestone id' }
  if (prompt.length < 30) return { error: 'Prompt needs to be at least 30 characters' }
  const avatarId = String(form.get('avatar_id') ?? '').trim() || undefined
  const voiceId = String(form.get('voice_id') ?? '').trim() || undefined

  const start = await startHeyGenVideo({ prompt, avatarId, voiceId })
  if (!start.ok) return { error: start.error }

  const { error } = await supabase
    .from('climb_milestones')
    .update({
      heygen_job_id: start.videoId,
      heygen_status: 'processing',
      heygen_prompt: prompt,
      heygen_voice_id: voiceId ?? null,
      heygen_avatar_id: avatarId ?? null,
      heygen_started_at: new Date().toISOString(),
      heygen_completed_at: null,
      heygen_error: null,
    })
    .eq('id', milestoneId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/climb')
  return { ok: true, videoId: start.videoId, status: 'processing' }
}

export async function pollMilestoneVideo(_prev: HeyGenState, form: FormData): Promise<HeyGenState> {
  await requireAdmin()
  if (!heygenConfigured()) return { error: 'HEYGEN_API_KEY not configured' }
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const milestoneId = String(form.get('milestone_id') ?? '')
  if (!milestoneId) return { error: 'Missing milestone id' }

  const { data: milestone } = await supabase
    .from('climb_milestones')
    .select('heygen_job_id')
    .eq('id', milestoneId)
    .single()
  if (!milestone?.heygen_job_id) return { error: 'No HeyGen job started for this milestone' }

  const res = await getHeyGenStatus(milestone.heygen_job_id)
  if (!res.ok) return { error: res.error }

  const update: Record<string, unknown> = {
    heygen_status: res.status.status,
    heygen_error: res.status.error,
  }
  if (res.status.status === 'completed' && res.status.videoUrl) {
    update.video_url = res.status.videoUrl
    update.heygen_completed_at = new Date().toISOString()
  } else if (res.status.status === 'failed') {
    update.heygen_completed_at = new Date().toISOString()
  }
  const { error } = await supabase.from('climb_milestones').update(update).eq('id', milestoneId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/climb')
  return { ok: true, status: res.status.status }
}
