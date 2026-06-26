'use client'

import { useActionState, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import { upsertEpisode, deleteEpisode, type EpisodeState } from './actions'

export interface Episode {
  id: string
  episode_number: number | null
  season_number: number | null
  title: string
  description: string | null
  audio_url: string | null
  audio_bytes: number | null
  audio_mime: string | null
  duration_seconds: number | null
  published_at: string | null
  explicit: boolean | null
  image_url: string | null
  transcript: string | null
  play_count: number | null
  download_count: number | null
}

function fmtDuration(s: number | null): string {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read audio metadata'))
    }
    audio.src = url
  })
}

export function EpisodeManager({
  podcastId,
  userId,
  episodes,
}: {
  podcastId: string
  userId: string
  episodes: Episode[]
}) {
  const [editing, setEditing] = useState<Episode | 'new' | null>(null)

  const totalPlays = episodes.reduce((a, e) => a + (e.play_count ?? 0), 0)
  const totalDownloads = episodes.reduce((a, e) => a + (e.download_count ?? 0), 0)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-eyebrow text-primary">Episodes ({episodes.length})</p>
          {(totalPlays > 0 || totalDownloads > 0) && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {totalDownloads.toLocaleString()} downloads · {totalPlays.toLocaleString()} on-site
              plays
            </p>
          )}
        </div>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            + Add episode
          </button>
        )}
      </div>

      {editing !== null ? (
        <EpisodeForm
          podcastId={podcastId}
          userId={userId}
          episode={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : (
        <div className="space-y-2">
          {episodes.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-4 text-sm"
            >
              <div className="min-w-0">
                <p className="text-display font-bold">
                  {e.episode_number ? `#${e.episode_number} · ` : ''}
                  {e.title}
                  {!e.published_at && (
                    <span className="ml-2 rounded-full bg-panel-elevated px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Draft
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {e.published_at
                    ? `Published ${new Date(e.published_at).toLocaleDateString()}`
                    : 'Unpublished'}
                  {e.duration_seconds ? ` · ${fmtDuration(e.duration_seconds)}` : ''}
                  {e.audio_url ? '' : ' · ⚠ no audio'}
                  {(e.download_count ?? 0) > 0 || (e.play_count ?? 0) > 0
                    ? ` · ${e.download_count ?? 0} dl / ${e.play_count ?? 0} plays`
                    : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {e.audio_url && (
                  <audio controls preload="none" src={e.audio_url} className="h-8 max-w-[200px]" />
                )}
                <button
                  type="button"
                  onClick={() => setEditing(e)}
                  className="text-display rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-panel"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
          {episodes.length === 0 && (
            <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
              No episodes yet. Add your first — upload the audio and we&apos;ll capture its length
              and size for the feed.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function EpisodeForm({
  podcastId,
  userId,
  episode,
  onClose,
}: {
  podcastId: string
  userId: string
  episode: Episode | null
  onClose: () => void
}) {
  const [state, action, pending] = useActionState<EpisodeState, FormData>(upsertEpisode, {})
  const [audioUrl, setAudioUrl] = useState(episode?.audio_url ?? '')
  const [audioBytes, setAudioBytes] = useState(episode?.audio_bytes ? String(episode.audio_bytes) : '')
  const [audioMime, setAudioMime] = useState(episode?.audio_mime ?? '')
  const [duration, setDuration] = useState(
    episode?.duration_seconds ? String(episode.duration_seconds) : ''
  )
  const [imageUrl, setImageUrl] = useState(episode?.image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)

  // Close on successful save.
  if (state.ok) {
    onClose()
  }

  const onPickAudio = async (file: File | undefined) => {
    if (!file) return
    setUploadErr(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const safe = file.name.replace(/[^a-z0-9._-]/gi, '-').slice(-80)
      const path = `${userId}/${podcastId}/${Date.now()}-${safe}`
      const { error } = await supabase.storage
        .from('podcast-media')
        .upload(path, file, { upsert: true, contentType: file.type || 'audio/mpeg' })
      if (error) throw error
      const { data: pub } = supabase.storage.from('podcast-media').getPublicUrl(path)
      setAudioUrl(pub.publicUrl)
      setAudioBytes(String(file.size))
      setAudioMime(file.type || 'audio/mpeg')
      try {
        const dur = await readAudioDuration(file)
        if (Number.isFinite(dur)) setDuration(String(Math.round(dur)))
      } catch {
        /* duration optional */
      }
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const inputCls =
    'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'

  return (
    <form action={action} className="space-y-4 rounded-[var(--radius)] border border-primary/30 bg-panel/30 p-5">
      <input type="hidden" name="podcast_id" value={podcastId} />
      {episode && <input type="hidden" name="episode_id" value={episode.id} />}
      <input type="hidden" name="audio_url" value={audioUrl} />
      <input type="hidden" name="audio_bytes" value={audioBytes} />
      <input type="hidden" name="audio_mime" value={audioMime} />
      <input type="hidden" name="duration_seconds" value={duration} />
      <input type="hidden" name="image_url" value={imageUrl} />
      {episode?.published_at && (
        <input type="hidden" name="published_at_existing" value={episode.published_at} />
      )}

      <p className="text-eyebrow text-primary">{episode ? 'Edit episode' : 'New episode'}</p>

      {/* Audio */}
      <div className="rounded-[var(--radius-sm)] border border-border bg-background/50 p-3">
        <span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Audio file
        </span>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => onPickAudio(e.target.files?.[0])}
          disabled={uploading}
          className="mt-2 block w-full text-xs file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-primary-foreground"
        />
        {uploading && <p className="mt-2 text-xs text-accent">Uploading…</p>}
        {uploadErr && <p className="mt-2 text-xs text-destructive">{uploadErr}</p>}
        {audioUrl && !uploading && (
          <div className="mt-2 space-y-1">
            <audio controls preload="none" src={audioUrl} className="h-8 w-full" />
            <p className="text-[10px] text-muted-foreground">
              {audioMime || 'audio'}
              {audioBytes ? ` · ${(Number(audioBytes) / 1_048_576).toFixed(1)} MB` : ''}
              {duration ? ` · ${fmtDuration(Number(duration))}` : ''}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="block text-xs text-muted-foreground">Title</span>
          <input name="title" required defaultValue={episode?.title} className={inputCls} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="block text-xs text-muted-foreground">Show notes / description</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={episode?.description ?? ''}
            className={inputCls}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="block text-xs text-muted-foreground">
            Transcript (optional — shown on the episode page)
          </span>
          <textarea
            name="transcript"
            rows={5}
            defaultValue={episode?.transcript ?? ''}
            placeholder="Paste the episode transcript…"
            className={inputCls}
          />
        </label>
        <label className="block text-sm">
          <span className="block text-xs text-muted-foreground">Episode #</span>
          <input
            name="episode_number"
            type="number"
            min={0}
            defaultValue={episode?.episode_number ?? ''}
            className={inputCls}
          />
        </label>
        <label className="block text-sm">
          <span className="block text-xs text-muted-foreground">Season # (optional)</span>
          <input
            name="season_number"
            type="number"
            min={0}
            defaultValue={episode?.season_number ?? ''}
            className={inputCls}
          />
        </label>
        <div className="block text-sm sm:col-span-2">
          <span className="block text-xs text-muted-foreground">Episode art (optional)</span>
          <div className="mt-1">
            <AssetPicker value={imageUrl} onChange={setImageUrl} accept="image/*" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="explicit" defaultChecked={episode?.explicit ?? false} className="h-4 w-4 accent-primary" />
          Explicit
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="published"
            defaultChecked={Boolean(episode?.published_at)}
            className="h-4 w-4 accent-primary"
          />
          Published (visible in feed)
        </label>
      </div>

      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <button
          type="submit"
          disabled={pending || uploading}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save episode'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-display rounded-[var(--radius-sm)] border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-panel"
        >
          Cancel
        </button>
        {episode && <DeleteEpisodeButton episodeId={episode.id} podcastId={podcastId} onDone={onClose} />}
      </div>
    </form>
  )
}

function DeleteEpisodeButton({
  episodeId,
  podcastId,
  onDone,
}: {
  episodeId: string
  podcastId: string
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm('Delete this episode?')) return
        setBusy(true)
        const res = await deleteEpisode(episodeId, podcastId)
        setBusy(false)
        if (res.ok) onDone()
        else alert(res.error ?? 'Delete failed')
      }}
      className="text-display ml-auto rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-destructive disabled:opacity-50"
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  )
}
