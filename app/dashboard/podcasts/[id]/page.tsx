import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PodcastEditor } from './editor'

export const metadata = { title: 'Podcast editor' }

export default async function PodcastEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('*')
    .eq('id', id)
    .single()
  if (!podcast || podcast.user_id !== user.id) notFound()

  const { data: episodes } = await supabase
    .from('podcast_episodes')
    .select(
      'id, episode_number, season_number, title, description, audio_url, audio_bytes, audio_mime, duration_seconds, published_at, explicit, image_url, transcript, play_count, download_count'
    )
    .eq('podcast_id', id)
    .order('episode_number', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/podcasts"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Podcasts
        </Link>
        <p className="text-eyebrow mt-3 text-accent">Podcast editor</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
          {podcast.title}
        </h1>
      </div>
      <PodcastEditor podcast={podcast} episodes={episodes ?? []} />
    </div>
  )
}
