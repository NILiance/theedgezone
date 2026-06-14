'use client'

import { useActionState, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertMilestone, deleteMilestone } from './actions'
import {
  startMilestoneVideo,
  pollMilestoneVideo,
  type HeyGenState,
} from './heygen-actions'

interface Milestone {
  id: string
  slug: string
  title: string
  summary: string | null
  position: number
  hero_image_url: string | null
  video_url: string | null
  slides: Array<{ heading?: string; body?: string; media_url?: string }>
  cta_label: string | null
  cta_url: string | null
  duration_min: number | null
  audience: string
  published: boolean
  heygen_job_id?: string | null
  heygen_status?: string | null
  heygen_prompt?: string | null
  heygen_error?: string | null
  heygen_started_at?: string | null
  heygen_completed_at?: string | null
}

export function ClimbAdminClient({ milestones }: { milestones: Milestone[] }) {
  const [editing, setEditing] = useState<Milestone | 'new' | null>(null)
  const [isPending, startTransition] = useTransition()

  if (editing) {
    return (
      <MilestoneEditor
        milestone={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    )
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this milestone?')) return
    const fd = new FormData()
    fd.set('milestone_id', id)
    startTransition(async () => {
      await deleteMilestone(fd)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>+ Add milestone</Button>
      </div>
      {milestones.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No milestones yet.
        </p>
      ) : (
        <ol className="space-y-3">
          {milestones.map((m, i) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-4 rounded-[var(--radius)] border border-border bg-panel/40 p-4"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-display text-sm font-black text-primary">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-display font-bold">{m.title}</p>
                {m.summary && (
                  <p className="text-xs text-muted-foreground">{m.summary}</p>
                )}
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  audience: {m.audience}
                  {m.duration_min && ` · ${m.duration_min}m`}
                  {!m.published && ' · DRAFT'}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(m)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(m.id)}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function MilestoneEditor({ milestone, onClose }: { milestone: Milestone | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [slidesJson, setSlidesJson] = useState(
    JSON.stringify(milestone?.slides ?? [], null, 2)
  )

  const action = (fd: FormData) => {
    setError(null)
    fd.set('slides', slidesJson)
    startTransition(async () => {
      const res = await upsertMilestone(fd)
      if (res.ok) onClose()
      else setError(res.message ?? 'Save failed')
    })
  }

  return (
    <form action={action} className="space-y-4">
      {milestone?.id && <input type="hidden" name="milestone_id" value={milestone.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px]">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={milestone?.title} required />
        </div>
        <div>
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            name="position"
            type="number"
            defaultValue={milestone?.position ?? 0}
          />
        </div>
        <div>
          <Label htmlFor="duration_min">Duration (min)</Label>
          <Input
            id="duration_min"
            name="duration_min"
            type="number"
            defaultValue={milestone?.duration_min ?? ''}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="summary">Summary</Label>
        <textarea
          id="summary"
          name="summary"
          rows={2}
          defaultValue={milestone?.summary ?? ''}
          className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="hero_image_url">Hero image URL</Label>
          <Input
            id="hero_image_url"
            name="hero_image_url"
            type="url"
            defaultValue={milestone?.hero_image_url ?? ''}
            placeholder="https://…"
          />
        </div>
        <div>
          <Label htmlFor="video_url">Narrator video URL</Label>
          <Input
            id="video_url"
            name="video_url"
            type="url"
            defaultValue={milestone?.video_url ?? ''}
            placeholder="https://… (HeyGen / YouTube)"
          />
        </div>
        <div>
          <Label htmlFor="cta_label">CTA label</Label>
          <Input
            id="cta_label"
            name="cta_label"
            defaultValue={milestone?.cta_label ?? ''}
            placeholder="Open Brand Studio"
          />
        </div>
        <div>
          <Label htmlFor="cta_url">CTA URL</Label>
          <Input
            id="cta_url"
            name="cta_url"
            defaultValue={milestone?.cta_url ?? ''}
            placeholder="/dashboard/…"
          />
        </div>
        <div>
          <Label htmlFor="audience">Audience</Label>
          <select
            id="audience"
            name="audience"
            defaultValue={milestone?.audience ?? 'all'}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            <option value="all">Everyone</option>
            <option value="talent">Talent only</option>
            <option value="brand">Brands only</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="slides">Slides (JSON array of {`{ heading, body, media_url }`})</Label>
        <textarea
          id="slides"
          value={slidesJson}
          onChange={(e) => setSlidesJson(e.target.value)}
          rows={8}
          className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="published"
          defaultChecked={milestone?.published ?? true}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm">Published</span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : milestone ? 'Save milestone' : 'Add milestone'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
      {milestone?.id && <HeyGenPanel milestone={milestone} />}
    </form>
  )
}

function HeyGenPanel({ milestone }: { milestone: Milestone }) {
  const [startState, startAction, startPending] = useActionState<HeyGenState, FormData>(
    startMilestoneVideo,
    {}
  )
  const [pollState, pollAction, pollPending] = useActionState<HeyGenState, FormData>(
    pollMilestoneVideo,
    {}
  )
  const status = startState.status ?? pollState.status ?? milestone.heygen_status ?? null
  const inFlight = status === 'pending' || status === 'processing' || status === 'waiting'

  return (
    <section className="mt-6 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Generate narrator video (HeyGen)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Spin up an AI avatar reading the script below. Status writes back to{' '}
            <code className="font-mono">video_url</code> once complete.
          </p>
        </div>
        {status && (
          <span
            className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
              status === 'completed'
                ? 'bg-success/20 text-success'
                : status === 'failed'
                ? 'bg-destructive/20 text-destructive'
                : 'bg-accent/20 text-accent'
            }`}
          >
            {status}
          </span>
        )}
      </div>
      <form action={startAction} className="mt-3 space-y-3">
        <input type="hidden" name="milestone_id" value={milestone.id} />
        <textarea
          name="prompt"
          rows={4}
          defaultValue={milestone.heygen_prompt ?? milestone.summary ?? ''}
          placeholder="Welcome to the Climb. Today's milestone is…"
          required
          minLength={30}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="avatar_id"
            placeholder="Avatar ID (optional)"
            className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-xs font-mono"
          />
          <input
            name="voice_id"
            placeholder="Voice ID (optional)"
            className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-xs font-mono"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={startPending || inFlight}>
            {startPending ? 'Starting…' : inFlight ? 'In flight…' : milestone.heygen_job_id ? 'Re-generate' : 'Generate video'}
          </Button>
          {milestone.heygen_job_id && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const fd = new FormData()
                fd.set('milestone_id', milestone.id)
                pollAction(fd)
              }}
              disabled={pollPending}
            >
              {pollPending ? 'Checking…' : 'Refresh status'}
            </Button>
          )}
        </div>
      </form>
      {startState.error && <p className="mt-2 text-xs text-destructive">{startState.error}</p>}
      {pollState.error && <p className="mt-2 text-xs text-destructive">{pollState.error}</p>}
      {milestone.heygen_error && (
        <p className="mt-2 text-xs text-destructive">
          HeyGen error: {milestone.heygen_error}
        </p>
      )}
      {milestone.heygen_started_at && (
        <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Started {new Date(milestone.heygen_started_at).toLocaleString()}
          {milestone.heygen_completed_at &&
            ` · finished ${new Date(milestone.heygen_completed_at).toLocaleString()}`}
        </p>
      )}
    </section>
  )
}
