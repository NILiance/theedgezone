'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { regeneratePage } from '@/app/dashboard/sites/generate-actions'

export function RegeneratePageButton({ pageId }: { pageId: string }) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const action = () => {
    if (
      !confirm(
        'Regenerating replaces ALL blocks on this page with a fresh set. Continue?'
      )
    )
      return
    setError(null)
    const fd = new FormData()
    fd.set('page_id', pageId)
    if (prompt.trim()) fd.set('prompt', prompt)
    startTransition(async () => {
      const res = await regeneratePage(fd)
      if (res.ok) {
        setOpen(false)
        setPrompt('')
      } else {
        setError(res.message ?? 'Generate failed')
      }
    })
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Regenerate page
      </Button>
    )
  }

  return (
    <div className="w-full space-y-2">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder="Optional: tell us anything specific — audience, tone, hooks…"
        className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={action} disabled={isPending}>
          {isPending ? 'Generating…' : 'Generate page'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false)
            setPrompt('')
          }}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
