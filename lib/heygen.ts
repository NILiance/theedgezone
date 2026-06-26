/**
 * HeyGen v2 video generation helper.
 *
 * Flow:
 *   1. POST /v2/video/generate to start a job → returns { video_id }
 *   2. Poll /v1/video_status.get?video_id=... until status is "completed"
 *   3. Download video_url from the response and store in our bucket
 *
 * Docs: https://docs.heygen.com/reference/create-an-avatar-video-v2
 */
import { env } from '@/lib/env'

const BASE = 'https://api.heygen.com'

export interface HeyGenGenerateInput {
  prompt: string
  avatarId?: string
  voiceId?: string
  background?: { type: 'color'; value: string } | { type: 'image'; url: string }
  dimension?: { width: number; height: number }
  testMode?: boolean
}

export function heygenConfigured(): boolean {
  return Boolean(env.HEYGEN_API_KEY)
}

function authHeaders(): Record<string, string> {
  return {
    'X-Api-Key': env.HEYGEN_API_KEY ?? '',
    'Content-Type': 'application/json',
  }
}

export async function startHeyGenVideo(
  input: HeyGenGenerateInput
): Promise<{ ok: true; videoId: string } | { ok: false; error: string }> {
  if (!heygenConfigured()) return { ok: false, error: 'HEYGEN_API_KEY not configured' }
  const avatarId = input.avatarId ?? 'Daisy-inskirt-20220818'
  const voiceId = input.voiceId ?? '1bd001e7e50f421d891986aad5158bc8'
  try {
    const res = await fetch(`${BASE}/v2/video/generate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: avatarId,
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: input.prompt.slice(0, 1500),
              voice_id: voiceId,
            },
            background: input.background ?? { type: 'color', value: '#0a0e14' },
          },
        ],
        dimension: input.dimension ?? { width: 1280, height: 720 },
        test: input.testMode ?? false,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `HeyGen generate HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    const json = (await res.json()) as { data?: { video_id?: string }; error?: { message?: string } }
    const videoId = json.data?.video_id
    if (!videoId) {
      return { ok: false, error: json.error?.message ?? 'HeyGen returned no video_id' }
    }
    return { ok: true, videoId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'HeyGen network error' }
  }
}

export interface HeyGenStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'waiting'
  videoUrl?: string | null
  thumbnailUrl?: string | null
  duration?: number | null
  error?: string | null
}

export interface HeyGenAvatar {
  id: string
  name: string
  gender: string | null
  previewImageUrl: string | null
}

export interface HeyGenVoice {
  id: string
  name: string
  language: string | null
  gender: string | null
  previewAudioUrl: string | null
}

/**
 * List available avatars. HeyGen returns hundreds, so we trim to the
 * fields the picker needs and let the caller cap/filter.
 */
export async function listHeyGenAvatars(): Promise<
  { ok: true; avatars: HeyGenAvatar[] } | { ok: false; error: string }
> {
  if (!heygenConfigured()) return { ok: false, error: 'HEYGEN_API_KEY not configured' }
  try {
    const res = await fetch(`${BASE}/v2/avatars`, { method: 'GET', headers: authHeaders() })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `HeyGen avatars HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    const json = (await res.json()) as {
      data?: {
        avatars?: Array<{
          avatar_id?: string
          avatar_name?: string
          gender?: string
          preview_image_url?: string
        }>
      }
    }
    const avatars: HeyGenAvatar[] = (json.data?.avatars ?? [])
      .filter((a) => a.avatar_id)
      .map((a) => ({
        id: a.avatar_id as string,
        name: a.avatar_name ?? (a.avatar_id as string),
        gender: a.gender ?? null,
        previewImageUrl: a.preview_image_url ?? null,
      }))
    return { ok: true, avatars }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'HeyGen network error' }
  }
}

/** List available voices (text-to-speech). */
export async function listHeyGenVoices(): Promise<
  { ok: true; voices: HeyGenVoice[] } | { ok: false; error: string }
> {
  if (!heygenConfigured()) return { ok: false, error: 'HEYGEN_API_KEY not configured' }
  try {
    const res = await fetch(`${BASE}/v2/voices`, { method: 'GET', headers: authHeaders() })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `HeyGen voices HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    const json = (await res.json()) as {
      data?: {
        voices?: Array<{
          voice_id?: string
          name?: string
          language?: string
          gender?: string
          preview_audio?: string
        }>
      }
    }
    const voices: HeyGenVoice[] = (json.data?.voices ?? [])
      .filter((v) => v.voice_id)
      .map((v) => ({
        id: v.voice_id as string,
        name: v.name ?? (v.voice_id as string),
        language: v.language ?? null,
        gender: v.gender ?? null,
        previewAudioUrl: v.preview_audio ?? null,
      }))
    return { ok: true, voices }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'HeyGen network error' }
  }
}

export async function getHeyGenStatus(
  videoId: string
): Promise<{ ok: true; status: HeyGenStatus } | { ok: false; error: string }> {
  if (!heygenConfigured()) return { ok: false, error: 'HEYGEN_API_KEY not configured' }
  try {
    const res = await fetch(`${BASE}/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`, {
      method: 'GET',
      headers: authHeaders(),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `HeyGen status HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    const json = (await res.json()) as {
      data?: {
        status?: string
        video_url?: string
        thumbnail_url?: string
        duration?: number
        error?: { message?: string }
      }
    }
    const raw = json.data?.status ?? 'pending'
    const status: HeyGenStatus['status'] =
      raw === 'completed' || raw === 'processing' || raw === 'pending' || raw === 'failed' || raw === 'waiting'
        ? raw
        : 'pending'
    return {
      ok: true,
      status: {
        status,
        videoUrl: json.data?.video_url ?? null,
        thumbnailUrl: json.data?.thumbnail_url ?? null,
        duration: json.data?.duration ?? null,
        error: json.data?.error?.message ?? null,
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'HeyGen network error' }
  }
}
