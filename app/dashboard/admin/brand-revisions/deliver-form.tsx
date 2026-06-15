'use client'

import { useActionState } from 'react'
import { deliverRevisionAction, type DeliverState } from './actions'

export function DeliverRevisionForm({
  revisionId,
  brandId,
}: {
  revisionId: string
  brandId: string
}) {
  const [state, action, pending] = useActionState<DeliverState, FormData>(
    deliverRevisionAction,
    {}
  )
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="revision_id" value={revisionId} />
      <input type="hidden" name="brand_id" value={brandId} />
      <div>
        <label className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Revised image (PNG/JPG)
        </label>
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg"
          required
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Admin note (optional, internal)
        </label>
        <input
          type="text"
          name="admin_note"
          placeholder="What changed in this revision"
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-success px-4 py-2 text-xs font-bold uppercase tracking-widest text-success-foreground disabled:opacity-50"
        >
          {pending ? 'Delivering…' : 'Deliver revision'}
        </button>
        {state.ok && (
          <span className="text-display rounded-full bg-success/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-success">
            ✓ Delivered
          </span>
        )}
        {state.error && (
          <span className="text-xs text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  )
}
