'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCmsPage, type PagesState } from './actions'

export function NewPageForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState<PagesState, FormData>(createCmsPage, {})

  useEffect(() => {
    if (state.ok && state.id) {
      router.push(`/dashboard/admin/pages/${state.id}`)
    }
  }, [state, router])

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <label className="flex-1 text-sm">
        <span className="block text-xs text-muted-foreground">New page title</span>
        <input
          name="title"
          required
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-sm"
        />
      </label>
      <label className="flex-1 text-sm">
        <span className="block text-xs text-muted-foreground">Slug (optional)</span>
        <input
          name="slug"
          placeholder="auto-from-title"
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Creating…' : '+ New page'}
      </button>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  )
}
