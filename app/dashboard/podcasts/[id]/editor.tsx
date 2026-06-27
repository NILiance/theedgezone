'use client'

import { useActionState, useState } from 'react'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import { savePodcast, type PodcastState } from './actions'
import { EpisodeManager, type Episode } from './episode-manager'

type Podcast = {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_url: string | null
  status: string
  apple_connect_email: string | null
  rss_url: string | null
  slug: string
  author: string | null
  category: string | null
  language: string | null
  explicit: boolean | null
  primary_color: string | null
  secondary_color: string | null
  apple_url: string | null
  spotify_url: string | null
  youtube_url: string | null
  amazon_url: string | null
  subscription_enabled: boolean | null
  subscription_price_cents: number | null
}

const inputCls =
  'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2'

export function PodcastEditor({ podcast, episodes }: { podcast: Podcast; episodes: Episode[] }) {
  const [state, action, pending] = useActionState<PodcastState, FormData>(savePodcast, {})
  const [cover, setCover] = useState(podcast.cover_url ?? '')

  const feedUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/podcasts/${podcast.slug}/feed.xml` : ''
  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/podcasts/${podcast.slug}` : ''

  return (
    <div className="space-y-8">
      <form
        action={action}
        className="space-y-4 rounded-[var(--radius)] border border-border bg-panel/40 p-5"
      >
        <input type="hidden" name="podcast_id" value={podcast.id} />
        <input type="hidden" name="cover_url" value={cover} />
        <p className="text-eyebrow text-primary">Show details</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Title</span>
            <input name="title" required defaultValue={podcast.title} className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Status</span>
            <select name="status" defaultValue={podcast.status} className={inputCls}>
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
              className={inputCls}
            />
          </label>
          <div className="block text-sm sm:col-span-2">
            <span className="block text-xs text-muted-foreground">Cover art (1400–3000px square)</span>
            <div className="mt-1">
              <AssetPicker value={cover} onChange={setCover} accept="image/*" />
            </div>
          </div>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Author / host</span>
            <input name="author" defaultValue={podcast.author ?? ''} className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Apple category</span>
            <input
              name="category"
              defaultValue={podcast.category ?? ''}
              placeholder="e.g. Sports"
              className={inputCls}
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Language</span>
            <input name="language" defaultValue={podcast.language ?? 'en'} className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Owner email (Apple)</span>
            <input
              type="email"
              name="apple_connect_email"
              defaultValue={podcast.apple_connect_email ?? ''}
              className={inputCls}
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Site &amp; player accent color</span>
            <input
              type="color"
              name="primary_color"
              defaultValue={podcast.primary_color ?? '#C8A84E'}
              className="mt-1 h-10 w-20 rounded-[var(--radius-sm)] border border-border bg-background p-1"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Site &amp; player background color</span>
            <input
              type="color"
              name="secondary_color"
              defaultValue={podcast.secondary_color ?? '#0a0a0a'}
              className="mt-1 h-10 w-20 rounded-[var(--radius-sm)] border border-border bg-background p-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="explicit"
              defaultChecked={podcast.explicit ?? false}
              className="h-4 w-4 accent-primary"
            />
            Mark show as explicit
          </label>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-eyebrow text-primary">Distribution links</p>
          <p className="text-xs text-muted-foreground">
            After your feed is approved on each platform, paste the show URLs here — the public
            player links straight to your real listings.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="block text-xs text-muted-foreground">Apple Podcasts URL</span>
              <input name="apple_url" defaultValue={podcast.apple_url ?? ''} placeholder="https://podcasts.apple.com/…" className={`${inputCls} font-mono text-xs`} />
            </label>
            <label className="block text-sm">
              <span className="block text-xs text-muted-foreground">Spotify URL</span>
              <input name="spotify_url" defaultValue={podcast.spotify_url ?? ''} placeholder="https://open.spotify.com/show/…" className={`${inputCls} font-mono text-xs`} />
            </label>
            <label className="block text-sm">
              <span className="block text-xs text-muted-foreground">YouTube URL</span>
              <input name="youtube_url" defaultValue={podcast.youtube_url ?? ''} placeholder="https://youtube.com/@…" className={`${inputCls} font-mono text-xs`} />
            </label>
            <label className="block text-sm">
              <span className="block text-xs text-muted-foreground">Amazon Music URL</span>
              <input name="amazon_url" defaultValue={podcast.amazon_url ?? ''} placeholder="https://music.amazon.com/podcasts/…" className={`${inputCls} font-mono text-xs`} />
            </label>
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-eyebrow text-primary">Monetization</p>
          <p className="text-xs text-muted-foreground">
            Charge for premium episodes. Subscribers get a private feed URL; the public feed +
            player hide premium episodes.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="subscription_enabled"
                defaultChecked={podcast.subscription_enabled ?? false}
                className="h-4 w-4 accent-primary"
              />
              Enable paid subscriptions
            </label>
            <label className="block text-sm">
              <span className="block text-xs text-muted-foreground">Price per month (USD)</span>
              <input
                name="subscription_price"
                type="number"
                min={1}
                step="0.01"
                defaultValue={
                  podcast.subscription_price_cents
                    ? (podcast.subscription_price_cents / 100).toFixed(2)
                    : ''
                }
                placeholder="5.00"
                className={inputCls}
              />
            </label>
          </div>
        </div>

        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
        {state.ok && <p className="text-xs text-success">Saved.</p>}
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save show'}
        </button>
      </form>

      {/* Publish links */}
      <div className="grid gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Public page</p>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="break-all text-xs text-primary hover:underline">
            {publicUrl || `/podcasts/${podcast.slug}`}
          </a>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">RSS feed</p>
          <a href={feedUrl} target="_blank" rel="noreferrer" className="break-all text-xs text-primary hover:underline">
            {feedUrl || `/podcasts/${podcast.slug}/feed.xml`}
          </a>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Submit this URL to Apple Podcasts, Spotify, etc. Set the show to “Live” first.
          </p>
        </div>
      </div>

      <EpisodeManager podcastId={podcast.id} userId={podcast.user_id} episodes={episodes} />
    </div>
  )
}
