'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertSetupTask, setSetupTaskStatus, deleteSetupTask } from './actions'

export interface SetupTask {
  id: string
  title: string
  detail: string | null
  category: string
  status: string
  env_var: string | null
  link: string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  migration: 'Database',
  env: 'Environment variables',
  credentials: 'Supplier credentials',
  integration: 'Integrations',
  config: 'Configuration',
  pricing: 'Pricing',
  go_live: 'Go live (test → active)',
  general: 'General',
}
const CATEGORY_ORDER = [
  'migration',
  'env',
  'credentials',
  'integration',
  'config',
  'pricing',
  'go_live',
  'general',
]
const STATUS_OPTS = ['todo', 'in_progress', 'done', 'skipped'] as const
const STATUS_TONE: Record<string, string> = {
  todo: 'bg-panel-elevated text-muted-foreground',
  in_progress: 'bg-accent/20 text-accent',
  done: 'bg-success/20 text-success',
  skipped: 'bg-panel-elevated text-muted-foreground line-through',
}

export function SetupManager({
  tasks,
  envPresence,
}: {
  tasks: SetupTask[]
  envPresence: Record<string, boolean>
}) {
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const done = tasks.filter((t) => t.status === 'done').length
  const counted = tasks.filter((t) => t.status !== 'skipped').length
  const pct = counted ? Math.round((done / counted) * 100) : 0

  const envTasks = tasks.filter((t) => t.env_var)
  const envSet = envTasks.filter((t) => envPresence[t.env_var!]).length

  const grouped = useMemo(() => {
    const map = new Map<string, SetupTask[]>()
    for (const t of tasks) {
      const k = CATEGORY_ORDER.includes(t.category) ? t.category : 'general'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(t)
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const)
  }, [tasks])

  const setStatus = (id: string, status: string) => {
    setMsg(null)
    startTransition(async () => {
      const res = await setSetupTaskStatus(id, status)
      if (!res.ok) setMsg(res.message ?? 'Update failed')
    })
  }
  const remove = (id: string) => {
    if (!confirm('Delete this task?')) return
    setMsg(null)
    startTransition(async () => {
      const res = await deleteSetupTask(id)
      if (!res.ok) setMsg(res.message ?? 'Delete failed')
    })
  }
  const save = (fd: FormData) => {
    setMsg(null)
    startTransition(async () => {
      const res = await upsertSetupTask(fd)
      if (res.ok) setEditing(null)
      else setMsg(res.message ?? 'Save failed')
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">System</p>
          <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
            Setup &amp; go-live checklist
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Every hole to close before (and while) going live — env vars, credentials, migrations,
            and test→active flips. Items that map to an environment variable show whether it&apos;s
            currently set on the server.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>+ Add task</Button>
      </div>

      {/* Progress */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Completed</p>
            <p className="text-display text-sm font-black text-primary">
              {done}/{counted} · {pct}%
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel-elevated">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Env vars detected
            </p>
            <p className="text-display text-sm font-black">
              {envSet}/{envTasks.length} set
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel-elevated">
            <div
              className="h-full bg-success"
              style={{ width: `${envTasks.length ? (envSet / envTasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {msg && <p className="text-sm text-destructive">{msg}</p>}

      {editing === 'new' && <TaskForm onSave={save} onCancel={() => setEditing(null)} pending={isPending} />}

      {grouped.map(([cat, items]) => (
        <section key={cat} className="space-y-2">
          <p className="text-eyebrow text-accent">{CATEGORY_LABEL[cat] ?? cat}</p>
          <div className="divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
            {items.map((t) =>
              editing === t.id ? (
                <div key={t.id} className="p-3">
                  <TaskForm task={t} onSave={save} onCancel={() => setEditing(null)} pending={isPending} />
                </div>
              ) : (
                <div key={t.id} className="flex flex-wrap items-start gap-3 p-3">
                  <select
                    value={t.status}
                    onChange={(e) => setStatus(t.id, e.target.value)}
                    disabled={isPending}
                    className={`text-display h-7 rounded-full border-0 px-2 text-[10px] font-bold uppercase tracking-widest ${
                      STATUS_TONE[t.status] ?? STATUS_TONE.todo
                    }`}
                  >
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{t.title}</p>
                    {t.detail && <p className="mt-0.5 text-xs text-muted-foreground">{t.detail}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {t.env_var && (
                        <span
                          className={`text-display rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                            envPresence[t.env_var]
                              ? 'bg-success/20 text-success'
                              : 'bg-destructive/20 text-destructive'
                          }`}
                        >
                          {t.env_var} {envPresence[t.env_var] ? '· set' : '· not set'}
                        </span>
                      )}
                      {t.link && (
                        <a
                          href={t.link}
                          className="text-[11px] font-bold text-primary hover:underline"
                          {...(t.link.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                        >
                          Open →
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(t.id)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(t.id)}
                      disabled={isPending}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

function TaskForm({
  task,
  onSave,
  onCancel,
  pending,
}: {
  task?: SetupTask
  onSave: (fd: FormData) => void
  onCancel: () => void
  pending: boolean
}) {
  return (
    <form
      action={onSave}
      className="space-y-3 rounded-[var(--radius)] border border-primary/30 bg-panel/30 p-4"
    >
      {task && <input type="hidden" name="id" value={task.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={task?.title} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="detail">Detail</Label>
          <textarea
            id="detail"
            name="detail"
            rows={2}
            defaultValue={task?.detail ?? ''}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={task?.category ?? 'general'}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="env_var">Env var (optional)</Label>
          <Input
            id="env_var"
            name="env_var"
            defaultValue={task?.env_var ?? ''}
            placeholder="e.g. SS_AUTO_FULFILL"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="link">Link (optional route or URL)</Label>
          <Input
            id="link"
            name="link"
            defaultValue={task?.link ?? ''}
            placeholder="/dashboard/admin/suppliers"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Saving…' : 'Save task'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
