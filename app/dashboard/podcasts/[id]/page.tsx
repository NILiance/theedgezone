import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PodcastEditor } from './editor'
import { DomainManager } from '@/components/dashboard/domain-manager'

export const metadata = { title: 'Podcast editor' }
// Transcription (Gemini) runs as a server action on this route — give it room.
export const maxDuration = 300

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
      'id, episode_number, season_number, title, description, audio_url, audio_bytes, audio_mime, duration_seconds, published_at, explicit, image_url, transcript, chapters, premium, play_count, download_count'
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
      <DomainManager
        targetType="podcast"
        entityId={podcast.id}
        slug={(podcast as { slug: string }).slug}
        subdomain={`${(podcast as { slug: string }).slug}.podcastfortalent.com`}
      />
      <PodcastEditor podcast={podcast} episodes={episodes ?? []} />
    </div>
  )
}
