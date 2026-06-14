'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  upsertPhase,
  deletePhase,
  upsertItem,
  deleteItem,
} from './actions'

interface Phase {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  position: number
  published: boolean
}

interface Item {
  id: string
  phase_id: string | null
  slug: string
  name: string
  description: string | null
  audience: string
  position: number
  recommended_action_url: string | null
  recommended_action_label: string | null
  published: boolean
}

interface Props {
  phases: Phase[]
  items: Item[]
}

export function RoadmapAdminClient({ phases, items }: Props) {
  const [editingPhase, setEditingPhase] = useState<Phase | 'new' | null>(null)
  const [editingItem, setEditingItem] = useState<Item | { phase_id: string } | null>(null)

  if (editingPhase) {
    return (
      <PhaseEditor
        phase={editingPhase === 'new' ? null : editingPhase}
        onClose={() => setEditingPhase(null)}
      />
    )
  }
  if (editingItem) {
    const isExisting = 'id' in editingItem
    return (
      <ItemEditor
        phases={phases}
        item={isExisting ? (editingItem as Item) : null}
        defaultPhaseId={
          isExisting ? (editingItem as Item).phase_id ?? '' : editingItem.phase_id
        }
        onClose={() => setEditingItem(null)}
      />
    )
  }

  const itemsByPhase = new Map<string | null, Item[]>()
  for (const it of items) {
    const k = it.phase_id ?? null
    if (!itemsByPhase.has(k)) itemsByPhase.set(k, [])
    itemsByPhase.get(k)!.push(it)
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setEditingPhase('new')}>+ Add phase</Button>
      </div>
      <div className="space-y-4">
        {phases.map((phase) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            items={itemsByPhase.get(phase.id) ?? []}
            onEditPhase={() => setEditingPhase(phase)}
            onNewItem={() => setEditingItem({ phase_id: phase.id })}
            onEditItem={(item) => setEditingItem(item)}
          />
        ))}
        {phases.length === 0 && (
          <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
            No phases yet — add one above to get started.
          </p>
        )}
      </div>
    </div>
  )
}

function PhaseSection({
  phase,
  items,
  onEditPhase,
  onNewItem,
  onEditItem,
}: {
  phase: Phase
  items: Item[]
  onEditPhase: () => void
  onNewItem: () => void
  onEditItem: (item: Item) => void
}) {
  const [isPending, startTransition] = useTransition()
  const handleDeletePhase = () => {
    if (!confirm(`Delete phase "${phase.name}" and all its items?`)) return
    const fd = new FormData()
    fd.set('phase_id', phase.id)
    startTransition(async () => {
      await deletePhase(fd)
    })
  }
  const handleDeleteItem = (id: string) => {
    if (!confirm('Delete this item?')) return
    const fd = new FormData()
    fd.set('item_id', id)
    startTransition(async () => {
      await deleteItem(fd)
    })
  }
  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{phase.icon}</span>
          <div>
            <p className="text-display text-lg font-bold">{phase.name}</p>
            {phase.description && (
              <p className="text-xs text-muted-foreground">{phase.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onEditPhase}>
            Edit phase
          </Button>
          <Button size="sm" onClick={onNewItem}>
            + Item
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDeletePhase}
            disabled={isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
          No items in this phase yet.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-display text-sm font-bold">{it.name}</p>
                {it.description && (
                  <p className="text-xs text-muted-foreground">{it.description}</p>
                )}
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  audience: {it.audience}
                  {!it.published && ' · DRAFT'}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => onEditItem(it)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteItem(it.id)}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function PhaseEditor({ phase, onClose }: { phase: Phase | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const action = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      const res = await upsertPhase(fd)
      if (res.ok) onClose()
      else setError(res.message ?? 'Save failed')
    })
  }
  return (
    <form action={action} className="space-y-4">
      {phase?.id && <input type="hidden" name="phase_id" value={phase.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px]">
        <div>
          <Label htmlFor="p_name">Name</Label>
          <Input id="p_name" name="name" defaultValue={phase?.name} required />
        </div>
        <div>
          <Label htmlFor="p_icon">Icon</Label>
          <Input id="p_icon" name="icon" defaultValue={phase?.icon ?? ''} maxLength={4} />
        </div>
        <div>
          <Label htmlFor="p_position">Order</Label>
          <Input id="p_position" name="position" type="number" defaultValue={phase?.position ?? 0} />
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor="p_description">Description</Label>
          <textarea
            id="p_description"
            name="description"
            defaultValue={phase?.description ?? ''}
            rows={2}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 sm:col-span-3">
          <input
            type="checkbox"
            name="published"
            defaultChecked={phase?.published ?? true}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Published</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : phase ? 'Save phase' : 'Add phase'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ItemEditor({
  phases,
  item,
  defaultPhaseId,
  onClose,
}: {
  phases: Phase[]
  item: Item | null
  defaultPhaseId: string
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const action = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      const res = await upsertItem(fd)
      if (res.ok) onClose()
      else setError(res.message ?? 'Save failed')
    })
  }
  return (
    <form action={action} className="space-y-4">
      {item?.id && <input type="hidden" name="item_id" value={item.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="phase_id">Phase</Label>
          <select
            id="phase_id"
            name="phase_id"
            defaultValue={item?.phase_id ?? defaultPhaseId}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            required
          >
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon} {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="i_position">Order</Label>
          <Input id="i_position" name="position" type="number" defaultValue={item?.position ?? 0} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="i_name">Name</Label>
          <Input id="i_name" name="name" defaultValue={item?.name} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="i_description">Description</Label>
          <textarea
            id="i_description"
            name="description"
            defaultValue={item?.description ?? ''}
            rows={3}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="i_audience">Audience</Label>
          <select
            id="i_audience"
            name="audience"
            defaultValue={item?.audience ?? 'all'}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            <option value="all">Everyone</option>
            <option value="talent">Talent only</option>
            <option value="brand">Brands only</option>
          </select>
        </div>
        <div>
          <Label htmlFor="i_action_label">Action label</Label>
          <Input
            id="i_action_label"
            name="recommended_action_label"
            defaultValue={item?.recommended_action_label ?? ''}
            placeholder="Open Profile"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="i_action_url">Action URL</Label>
          <Input
            id="i_action_url"
            name="recommended_action_url"
            defaultValue={item?.recommended_action_url ?? ''}
            placeholder="/dashboard/…"
          />
        </div>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            name="published"
            defaultChecked={item?.published ?? true}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Published</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : item ? 'Save item' : 'Add item'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
