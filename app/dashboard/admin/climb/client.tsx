'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertMilestone, deleteMilestone } from './actions'
import {
  startMilestoneVideo,
  pollMilestoneVideo,
  loadHeyGenOptions,
  draftMilestoneScript,
  type HeyGenState,
  type HeyGenOptions,
  type ScriptState,
} from './heygen-actions'
import type { HeyGenAvatar, HeyGenVoice } from '@/lib/heygen'

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
  heygen_avatar_id?: string | null
  heygen_voice_id?: string | null
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
  const [scriptState, scriptAction, scriptPending] = useActionState<ScriptState, FormData>(
    draftMilestoneScript,
    {}
  )

  // Controlled fields so "Draft script" + the pickers can write into them.
  const [prompt, setPrompt] = useState(milestone.heygen_prompt ?? milestone.summary ?? '')
  const [avatarId, setAvatarId] = useState(milestone.heygen_avatar_id ?? '')
  const [voiceId, setVoiceId] = useState(milestone.heygen_voice_id ?? '')

  // Avatar/voice catalog (loaded on demand).
  const [options, setOptions] = useState<HeyGenOptions | null>(null)
  const [optsPending, startOpts] = useTransition()
  const loadOptions = () =>
    startOpts(async () => {
      setOptions(await loadHeyGenOptions())
    })

  // When a fresh draft comes back, drop it into the prompt box — once per
  // draft (tracked via ref) so it never fights the admin's manual edits.
  const lastScriptRef = useRef<string | null>(null)
  useEffect(() => {
    if (scriptState.ok && scriptState.script && scriptState.script !== lastScriptRef.current) {
      lastScriptRef.current = scriptState.script
      setPrompt(scriptState.script)
    }
  }, [scriptState])

  const status = startState.status ?? pollState.status ?? milestone.heygen_status ?? null
  const inFlight = status === 'pending' || status === 'processing' || status === 'waiting'

  return (
    <section className="mt-6 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Generate narrator video (HeyGen)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick an avatar + voice, draft or paste the script, and spin up the video. Status
            writes back to <code className="font-mono">video_url</code> once complete (the poll
            cron also updates it automatically).
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

      {/* Script box + drafting */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`prompt-${milestone.id}`}>Narration script</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={scriptPending}
            onClick={() => {
              const fd = new FormData()
              fd.set('milestone_id', milestone.id)
              scriptAction(fd)
            }}
          >
            {scriptPending ? 'Drafting…' : '✨ Draft script'}
          </Button>
        </div>
        <textarea
          id={`prompt-${milestone.id}`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Welcome to the Climb. Today's milestone is…"
          className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        {scriptState.error && <p className="text-xs text-destructive">{scriptState.error}</p>}
      </div>

      {/* Avatar + voice picker */}
      <div className="mt-4">
        {!options ? (
          <Button type="button" size="sm" variant="outline" onClick={loadOptions} disabled={optsPending}>
            {optsPending ? 'Loading avatars & voices…' : 'Load avatars & voices'}
          </Button>
        ) : options.ok ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <AvatarPicker avatars={options.avatars ?? []} value={avatarId} onChange={setAvatarId} />
            <VoicePicker voices={options.voices ?? []} value={voiceId} onChange={setVoiceId} />
          </div>
        ) : (
          <p className="text-xs text-destructive">{options.error}</p>
        )}
        {(avatarId || voiceId) && (
          <p className="mt-2 text-[10px] font-mono text-muted-foreground">
            avatar: {avatarId || '(default)'} · voice: {voiceId || '(default)'}
          </p>
        )}
      </div>

      {/* Generate / re-generate */}
      <form
        action={(fd) => {
          fd.set('prompt', prompt)
          fd.set('avatar_id', avatarId)
          fd.set('voice_id', voiceId)
          startAction(fd)
        }}
        className="mt-4"
      >
        <input type="hidden" name="milestone_id" value={milestone.id} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={startPending || inFlight || prompt.trim().length < 30}>
            {startPending
              ? 'Starting…'
              : inFlight
              ? 'In flight…'
              : milestone.heygen_job_id
              ? 'Re-generate'
              : 'Generate video'}
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
          {prompt.trim().length < 30 && (
            <span className="self-center text-[10px] text-muted-foreground">
              Script needs ≥ 30 characters
            </span>
          )}
        </div>
      </form>
      {startState.error && <p className="mt-2 text-xs text-destructive">{startState.error}</p>}
      {pollState.error && <p className="mt-2 text-xs text-destructive">{pollState.error}</p>}
      {milestone.heygen_error && (
        <p className="mt-2 text-xs text-destructive">HeyGen error: {milestone.heygen_error}</p>
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

function AvatarPicker({
  avatars,
  value,
  onChange,
}: {
  avatars: HeyGenAvatar[]
  value: string
  onChange: (v: string) => void
}) {
  const [filter, setFilter] = useState('')
  const shown = filter
    ? avatars.filter((a) => a.name.toLowerCase().includes(filter.toLowerCase()))
    : avatars
  const selected = avatars.find((a) => a.id === value) ?? null
  return (
    <div>
      <Label>Avatar ({avatars.length})</Label>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter avatars…"
        className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-xs"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 text-sm"
      >
        <option value="">Default avatar</option>
        {shown.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
            {a.gender ? ` · ${a.gender}` : ''}
          </option>
        ))}
      </select>
      {selected?.previewImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={selected.previewImageUrl}
          alt={selected.name}
          className="mt-2 h-20 w-20 rounded-md border border-border object-cover"
        />
      )}
    </div>
  )
}

function VoicePicker({
  voices,
  value,
  onChange,
}: {
  voices: HeyGenVoice[]
  value: string
  onChange: (v: string) => void
}) {
  const [filter, setFilter] = useState('')
  const shown = filter
    ? voices.filter(
        (v) =>
          v.name.toLowerCase().includes(filter.toLowerCase()) ||
          (v.language ?? '').toLowerCase().includes(filter.toLowerCase())
      )
    : voices
  const selected = voices.find((v) => v.id === value) ?? null
  return (
    <div>
      <Label>Voice ({voices.length})</Label>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter voices…"
        className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-xs"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 text-sm"
      >
        <option value="">Default voice</option>
        {shown.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
            {v.language ? ` · ${v.language}` : ''}
            {v.gender ? ` · ${v.gender}` : ''}
          </option>
        ))}
      </select>
      {selected?.previewAudioUrl && (
        <audio controls src={selected.previewAudioUrl} className="mt-2 h-8 w-full">
          <track kind="captions" />
        </audio>
      )}
    </div>
  )
}
