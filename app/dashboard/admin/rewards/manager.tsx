'use client'

import { useActionState, useState } from 'react'
import { createReward, updateReward, deleteReward, type RewardState } from './actions'

type RewardItem = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  points_cost: number
  stock: number | null
  status: string
}

export function RewardsManager({ items }: { items: RewardItem[] }) {
  return (
    <div className="space-y-6">
      <NewItemForm />
      <div className="space-y-3">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No reward items yet.
          </p>
        )}
      </div>
    </div>
  )
}

function NewItemForm() {
  const [state, action, pending] = useActionState<RewardState, FormData>(createReward, {})
  return (
    <form action={action} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow mb-3 text-primary">+ Add reward item</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="name"
          placeholder="Name"
          required
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="points_cost"
          type="number"
          min={0}
          placeholder="Points cost"
          required
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="stock"
          type="number"
          min={0}
          placeholder="Stock (blank = unlimited)"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="image_url"
          placeholder="Image URL"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <textarea
          name="description"
          rows={2}
          placeholder="Description"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2 lg:col-span-4"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
        {state.ok && <p className="text-xs text-success">Added.</p>}
      </div>
    </form>
  )
}

function ItemRow({ item }: { item: RewardItem }) {
  const [editing, setEditing] = useState(false)
  const [upState, upAction, upPending] = useActionState<RewardState, FormData>(updateReward, {})
  const [delState, delAction, delPending] = useActionState<RewardState, FormData>(deleteReward, {})

  if (!editing) {
    return (
      <div className="flex items-center gap-4 rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="h-12 w-12 rounded object-cover" />
        )}
        <div className="flex-1">
          <p className="text-display font-bold">{item.name}</p>
          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
        </div>
        <div className="text-right text-xs">
          <p className="text-display text-base font-black text-primary">{item.points_cost} pts</p>
          <p className="text-muted-foreground">
            {item.stock == null ? 'unlimited' : `${item.stock} in stock`}
          </p>
        </div>
        <span
          className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
            item.status === 'active'
              ? 'bg-success/20 text-success'
              : 'bg-panel-elevated text-muted-foreground'
          }`}
        >
          {item.status}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1 text-xs font-bold uppercase tracking-widest"
        >
          Edit
        </button>
        <form action={delAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            disabled={delPending}
            className="text-display rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-destructive disabled:opacity-50"
          >
            {delPending ? '…' : 'Delete'}
          </button>
        </form>
        {delState.error && <p className="text-xs text-destructive">{delState.error}</p>}
      </div>
    )
  }
  return (
    <form action={upAction} className="rounded-[var(--radius)] border border-primary/40 bg-panel/40 p-4">
      <input type="hidden" name="id" value={item.id} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="name"
          defaultValue={item.name}
          required
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="points_cost"
          type="number"
          min={0}
          defaultValue={item.points_cost}
          required
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="stock"
          type="number"
          min={0}
          defaultValue={item.stock ?? ''}
          placeholder="blank = unlimited"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
        <select
          name="status"
          defaultValue={item.status}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          name="image_url"
          defaultValue={item.image_url ?? ''}
          placeholder="Image URL"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2"
        />
        <textarea
          name="description"
          rows={2}
          defaultValue={item.description ?? ''}
          placeholder="Description"
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2 lg:col-span-4"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={upPending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {upPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
        >
          Cancel
        </button>
        {upState.error && <p className="text-xs text-destructive">{upState.error}</p>}
        {upState.ok && <p className="text-xs text-success">Saved.</p>}
      </div>
    </form>
  )
}
