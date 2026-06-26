'use client'

import { useState, useTransition } from 'react'
import { markMigrationApplied, markMigrationPending } from './actions'

/**
 * Per-row reconciliation toggle. Pending rows get "Mark applied"; applied
 * rows get a quieter "Mark pending". Calls the server action and lets the
 * revalidate refresh the row.
 */
export function MigrationRowActions({
  version,
  applied,
}: {
  version: string
  applied: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (fn: (v: string) => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn(version)
      if (!res.ok) setError(res.error ?? 'Failed')
    })
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      {applied ? (
        <button
          type="button"
          onClick={() => run(markMigrationPending)}
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {pending ? '…' : 'Mark pending'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => run(markMigrationApplied)}
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] border border-success/50 bg-success/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-success hover:bg-success/20 disabled:opacity-50"
        >
          {pending ? '…' : 'Mark applied'}
        </button>
      )}
      {error && <span className="text-[9px] text-destructive">{error}</span>}
    </div>
  )
}
