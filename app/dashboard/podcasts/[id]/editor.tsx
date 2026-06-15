'use client'

import { useActionState } from 'react'
import { savePodcast, type PodcastState } from './actions'

type Podcast = {
  id: string
  title: string
  description: string | null
  cover_url: string | null
  status: string
  apple_connect_email: string | null
  rss_url: string | null
  slug: string
}

type Episode = {
  id: string
  episode_number: number | null
  title: string
  audio_url: string | null
  duration_seconds: number | null
  published_at: string | null
}

export function PodcastEditor({
  podcast,
  episodes,
}: {
  podcast: Podcast
  episodes: Episode[]
}) {
  const [state, action, pending] = useActionState<PodcastState, FormData>(savePodcast, {})
  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <input type="hidden" name="podcast_id" value={podcast.id} />
        <p className="text-eyebrow text-primary">Show details</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Title</span>
            <input
              name="title"
              required
              defaultValue={podcast.title}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Status</span>
            <select
              name="status"
              defaultValue={podcast.status}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="live">Live</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="block text-xs text-muted-foreground">Description</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={podcast.description ?? ''}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Cover URL</span>
            <input
              name="cover_url"
              defaultValue={podcast.cover_url ?? ''}
              placeholder="https://…"
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Apple Connect email</span>
            <input
              type="email"
              name="apple_connect_email"
              defaultValue={podcast.apple_connect_email ?? ''}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="block text-xs text-muted-foreground">RSS URL</span>
            <input
              name="rss_url"
              defaultValue={podcast.rss_url ?? ''}
              placeholder="https://…/feed.xml"
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
            />
          </label>
        </div>
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
        {state.ok && <p className="text-xs text-success">Saved.</p>}
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </form>

      <section>
        <p className="text-eyebrow mb-3 text-primary">Episodes</p>
        <div className="space-y-2">
          {episodes.map((e) => (
            <div
              key={e.id}
              className="rounded-[var(--radius)] border border-border bg-panel/40 p-4 text-sm"
            >
              <p className="text-display font-bold">
                {e.episode_number ? `#${e.episode_number} · ` : ''}
                {e.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.published_at
                  ? `Published ${new Date(e.published_at).toLocaleDateString()}`
                  : 'Unpublished'}
                {e.duration_seconds &&
                  ` · ${Math.round(e.duration_seconds / 60)} min`}
              </p>
              {e.audio_url && (
                <a
                  href={e.audio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-bold text-primary hover:underline"
                >
                  ▶ Listen
                </a>
              )}
            </div>
          ))}
          {episodes.length === 0 && (
            <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
              No episodes yet. The full episode uploader ships in the next round.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
