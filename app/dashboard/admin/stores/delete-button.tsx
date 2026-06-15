'use client'

import { useState, useTransition } from 'react'
import { deleteStore } from './actions'

export function DeleteStoreButton({ storeId, label }: { storeId: string; label: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-[10px] text-destructive">Sure?</span>
        <button
          type="button"
          onClick={() => {
            const fd = new FormData()
            fd.set('store_id', storeId)
            startTransition(async () => {
              await deleteStore(fd)
              setConfirming(false)
            })
          }}
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-destructive-foreground disabled:opacity-50"
        >
          {pending ? '…' : 'Yes'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      title={`Delete ${label}`}
      className="text-display rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10"
    >
      Delete
    </button>
  )
}
