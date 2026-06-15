'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

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
  const { error } = await supabase.from('podcasts').update(update).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/podcasts/${id}`)
  return { ok: true }
}
