'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveClimbReel } from './reel-actions'

export interface VideoMilestone {
  id: string
  title: string
  video_url: string
}

export interface ReelData {
  title: string
  subtitle: string | null
  milestone_ids: string[]
  published: boolean
}

/**
 * Platform Reel builder — pick which milestone narrator videos play (and in
 * what order) on the public /path-to-the-summit/reel page. The native
 * replacement for the legacy Cloudinary-stitched sizzle reel: instead of
 * re-encoding clips, the public player auto-advances through them.
 */
export function ClimbReelBuilder({
  reel,
  videoMilestones,
}: {
  reel: ReelData
  videoMilestones: VideoMilestone[]
}) {
  const byId = useMemo(
    () => new Map(videoMilestones.map((m) => [m.id, m])),
    [videoMilestones]
  )

  const [title, setTitle] = useState(reel.title)
  const [subtitle, setSubtitle] = useState(reel.subtitle ?? '')
  const [published, setPublished] = useState(reel.published)
  // Only keep ids that still have a video.
  const [included, setIncluded] = useState<string[]>(
    reel.milestone_ids.filter((id) => byId.has(id))
  )
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const available = videoMilestones.filter((m) => !included.includes(m.id))

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...included]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j]!, next[idx]!]
    setIncluded(next)
  }
  const remove = (id: string) => setIncluded(included.filter((x) => x !== id))
  const add = (id: string) => setIncluded([...included, id])

  const save = () => {
    setMsg(null)
    start(async () => {
      const fd = new FormData()
      fd.set('title', title)
      fd.set('subtitle', subtitle)
      fd.set('published', published ? 'on' : 'false')
      fd.set('milestone_ids', JSON.stringify(included))
      const res = await saveClimbReel(fd)
      setMsg(res.ok ? 'Saved' : res.message ?? 'Could not save.')
    })
  }

  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-eyebrow text-primary">Platform Reel</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A sizzle reel that plays the chosen milestone videos back-to-back. Only milestones
            with a finished narrator video can be added.
          </p>
        </div>
        <Link
          href="/path-to-the-summit/reel"
          target="_blank"
          className="text-xs font-bold text-primary hover:underline"
        >
          View public reel ↗
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="reel-title">Title</Label>
          <Input id="reel-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reel-subtitle">Subtitle</Label>
          <Input
            id="reel-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Optional tagline"
          />
        </div>
      </div>

      {videoMilestones.length === 0 ? (
        <p className="mt-4 rounded-[var(--radius-sm)] border border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
          No milestone videos yet. Generate narrator videos above, then add them to the reel.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* In the reel (ordered) */}
          <div>
            <p className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              In the reel ({included.length})
            </p>
            <ol className="mt-2 space-y-2">
              {included.length === 0 && (
                <li className="rounded-[var(--radius-sm)] border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  Add milestones from the right →
                </li>
              )}
              {included.map((id, idx) => {
                const m = byId.get(id)
                if (!m) return null
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-background p-2"
                  >
                    <span className="text-display flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-black text-primary">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{m.title}</span>
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-panel disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === included.length - 1}
                      aria-label="Move down"
                      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-panel disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      aria-label="Remove"
                      className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive/10"
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Available */}
          <div>
            <p className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Available ({available.length})
            </p>
            <ul className="mt-2 space-y-2">
              {available.length === 0 && (
                <li className="rounded-[var(--radius-sm)] border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  All videos are in the reel.
                </li>
              )}
              {available.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-background p-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{m.title}</span>
                  <button
                    type="button"
                    onClick={() => add(m.id)}
                    className="text-display rounded-[var(--radius-sm)] bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground"
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Published (visible to the public)
        </label>
        <Button onClick={save} disabled={pending}>
          {pending ? 'Saving…' : 'Save reel'}
        </Button>
        {msg && <span className="text-xs text-success">{msg}</span>}
      </div>
    </section>
  )
}
