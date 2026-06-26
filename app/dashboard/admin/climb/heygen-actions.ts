'use server'

import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import {
  startHeyGenVideo,
  getHeyGenStatus,
  heygenConfigured,
  listHeyGenAvatars,
  listHeyGenVoices,
  type HeyGenAvatar,
  type HeyGenVoice,
} from '@/lib/heygen'

export type HeyGenState = { ok?: boolean; error?: string; videoId?: string; status?: string }

export type HeyGenOptions = {
  ok: boolean
  error?: string
  avatars?: HeyGenAvatar[]
  voices?: HeyGenVoice[]
}

/**
 * Fetch the avatar + voice catalogs for the picker. HeyGen returns
 * hundreds; we cap avatars and prefer English voices to keep the payload
 * and the dropdowns manageable (the client adds a text filter on top).
 */
export async function loadHeyGenOptions(): Promise<HeyGenOptions> {
  await requireAdmin()
  if (!heygenConfigured()) return { ok: false, error: 'HEYGEN_API_KEY not configured' }

  const [av, vo] = await Promise.all([listHeyGenAvatars(), listHeyGenVoices()])
  if (!av.ok) return { ok: false, error: av.error }
  if (!vo.ok) return { ok: false, error: vo.error }

  const avatars = av.avatars
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 150)

  const isEnglish = (v: HeyGenVoice) => (v.language ?? '').toLowerCase().startsWith('english')
  const voices = vo.voices
    .slice()
    .sort((a, b) => {
      // English first, then by name.
      const ea = isEnglish(a) ? 0 : 1
      const eb = isEnglish(b) ? 0 : 1
      if (ea !== eb) return ea - eb
      return a.name.localeCompare(b.name)
    })
    .slice(0, 200)

  return { ok: true, avatars, voices }
}

export type ScriptState = { ok?: boolean; error?: string; script?: string }

/**
 * Draft a short narrator script for a milestone using Claude — an
 * encouraging climb-coach voice, ~90 words, ready to paste into HeyGen.
 */
export async function draftMilestoneScript(
  _prev: ScriptState,
  form: FormData
): Promise<ScriptState> {
  await requireAdmin()
  if (!env.ANTHROPIC_API_KEY) return { error: 'ANTHROPIC_API_KEY not configured' }
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }

  const milestoneId = String(form.get('milestone_id') ?? '')
  if (!milestoneId) return { error: 'Missing milestone id' }

  const { data: m } = await supabase
    .from('climb_milestones')
    .select('title, summary, slides, cta_label')
    .eq('id', milestoneId)
    .single()
  if (!m) return { error: 'Milestone not found' }

  const slideText = Array.isArray(m.slides)
    ? (m.slides as Array<{ heading?: string; body?: string }>)
        .map((s) => [s.heading, s.body].filter(Boolean).join(': '))
        .filter(Boolean)
        .join('\n')
    : ''

  const prompt = `You are the narrator for "Path to the Summit," a guided climb that walks an athlete from a new account to an NIL-ready operator. Write a short spoken script for one milestone — warm, motivating, plain-spoken, like a climbing coach at a camp on the mountain. No hashtags, no emojis, no stage directions. One paragraph, 80–100 words, that an on-screen avatar will read aloud.

Milestone: ${m.title}
${m.summary ? `Summary: ${m.summary}` : ''}
${slideText ? `Key points:\n${slideText}` : ''}
${m.cta_label ? `End by nudging them toward: ${m.cta_label}` : ''}

Return only the script text.`

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })
    const script = res.content
      .filter((b) => b.type === 'text')
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n')
      .trim()
    if (!script) return { error: 'No script was generated. Try again.' }
    return { ok: true, script }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Script generation failed' }
  }
}

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
