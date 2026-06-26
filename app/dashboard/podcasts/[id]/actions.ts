'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/gemini-transcribe'

export type PodcastState = { ok?: boolean; error?: string }

export async function savePodcast(_prev: PodcastState, form: FormData): Promise<PodcastState> {
  const user = await requireUser()
  const supabase = await createClient()
  const id = String(form.get('podcast_id') ?? '')
  if (!id) return { error: 'Missing id' }
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('user_id')
    .eq('id', id)
    .single()
  if (!podcast || podcast.user_id !== user.id) return { error: 'Not your podcast' }

  const update: Record<string, unknown> = {
    title: String(form.get('title') ?? '').trim() || 'Untitled Podcast',
    description: String(form.get('description') ?? '').trim() || null,
    status: String(form.get('status') ?? 'draft'),
    cover_url: String(form.get('cover_url') ?? '').trim() || null,
    apple_connect_email: String(form.get('apple_connect_email') ?? '').trim() || null,
    rss_url: String(form.get('rss_url') ?? '').trim() || null,
    updated_at: new Date().toISOString(),
  }
  // Persist the richer channel fields the RSS feed + player need too.
  update.author = String(form.get('author') ?? '').trim() || null
  update.category = String(form.get('category') ?? '').trim() || null
  update.language = String(form.get('language') ?? '').trim() || 'en'
  update.explicit = form.get('explicit') === 'on' || form.get('explicit') === 'true'
  update.primary_color = String(form.get('primary_color') ?? '').trim() || '#C8A84E'
  update.secondary_color = String(form.get('secondary_color') ?? '').trim() || '#0a0a0a'
  update.apple_url = String(form.get('apple_url') ?? '').trim() || null
  update.spotify_url = String(form.get('spotify_url') ?? '').trim() || null
  update.youtube_url = String(form.get('youtube_url') ?? '').trim() || null
  update.amazon_url = String(form.get('amazon_url') ?? '').trim() || null

  const { error } = await supabase.from('podcasts').update(update).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/podcasts/${id}`)
  return { ok: true }
}

export type EpisodeState = { ok?: boolean; error?: string }

function numOrNull(form: FormData, key: string): number | null {
  const v = String(form.get(key) ?? '').trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Parse a "M:SS Title" (or "H:MM:SS Title") per-line block into chapters. */
function parseChapters(text: string): { start: string; title: string }[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d{1,2}(?::\d{2}){1,2})\s+(.*)$/)
      return m
        ? { start: m[1]!, title: m[2]!.trim() }
        : { start: '0:00', title: line }
    })
    .filter((c) => c.title)
}

export async function upsertEpisode(_prev: EpisodeState, form: FormData): Promise<EpisodeState> {
  const user = await requireUser()
  const supabase = await createClient()
  const podcastId = String(form.get('podcast_id') ?? '')
  const episodeId = String(form.get('episode_id') ?? '')
  if (!podcastId) return { error: 'Missing podcast id' }

  const { data: podcast } = await supabase
    .from('podcasts')
    .select('user_id')
    .eq('id', podcastId)
    .single()
  if (!podcast || podcast.user_id !== user.id) return { error: 'Not your podcast' }

  const title = String(form.get('title') ?? '').trim()
  if (!title) return { error: 'Episode title is required' }

  const wantPublished = form.get('published') === 'on' || form.get('published') === 'true'
  const existingPublishedAt = String(form.get('published_at_existing') ?? '').trim()
  const publishedAt = wantPublished
    ? existingPublishedAt || new Date().toISOString()
    : null

  const row: Record<string, unknown> = {
    podcast_id: podcastId,
    title,
    description: String(form.get('description') ?? '').trim() || null,
    audio_url: String(form.get('audio_url') ?? '').trim() || null,
    audio_bytes: numOrNull(form, 'audio_bytes'),
    audio_mime: String(form.get('audio_mime') ?? '').trim() || null,
    duration_seconds: numOrNull(form, 'duration_seconds'),
    episode_number: numOrNull(form, 'episode_number'),
    season_number: numOrNull(form, 'season_number'),
    explicit: form.get('explicit') === 'on' || form.get('explicit') === 'true',
    image_url: String(form.get('image_url') ?? '').trim() || null,
    transcript: String(form.get('transcript') ?? '').trim() || null,
    chapters: parseChapters(String(form.get('chapters_text') ?? '')),
    published_at: publishedAt,
  }

  if (episodeId) {
    const { error } = await supabase
      .from('podcast_episodes')
      .update(row)
      .eq('id', episodeId)
      .eq('podcast_id', podcastId)
    if (error) return { error: error.message }
  } else {
    row.guid = crypto.randomUUID()
    const { error } = await supabase.from('podcast_episodes').insert(row)
    if (error) return { error: error.message }
  }
  revalidatePath(`/dashboard/podcasts/${podcastId}`)
  return { ok: true }
}

/** Generate (and save) a transcript for an episode from its audio, via Gemini. */
export async function generateEpisodeTranscript(
  episodeId: string
): Promise<{ ok: boolean; transcript?: string; message?: string }> {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: ep } = await supabase
    .from('podcast_episodes')
    .select('id, audio_url, podcast_id, podcasts!inner(user_id)')
    .eq('id', episodeId)
    .maybeSingle()
  const ownerId = (ep as { podcasts?: { user_id?: string } } | null)?.podcasts?.user_id
  if (!ep || ownerId !== user.id) return { ok: false, message: 'Not your episode' }
  if (!ep.audio_url) return { ok: false, message: 'This episode has no audio yet.' }

  const res = await transcribeAudio(ep.audio_url)
  if (!res.ok || !res.transcript) return { ok: false, message: res.error ?? 'Transcription failed' }

  await supabase
    .from('podcast_episodes')
    .update({ transcript: res.transcript })
    .eq('id', episodeId)
    .eq('podcast_id', ep.podcast_id)
  revalidatePath(`/dashboard/podcasts/${ep.podcast_id}`)
  return { ok: true, transcript: res.transcript }
}

export async function deleteEpisode(
  episodeId: string,
  podcastId: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('user_id')
    .eq('id', podcastId)
    .single()
  if (!podcast || podcast.user_id !== user.id) return { ok: false, error: 'Not your podcast' }
  const { error } = await supabase
    .from('podcast_episodes')
    .delete()
    .eq('id', episodeId)
    .eq('podcast_id', podcastId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/podcasts/${podcastId}`)
  return { ok: true }
}
