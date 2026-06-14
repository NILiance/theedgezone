'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateEpkSettings } from '../actions'

interface Props {
  epkId: string
  displayName: string | null
  tagline: string | null
  primary: string
  secondary: string
}

export function EpkSettingsForm({ epkId, displayName, tagline, primary, secondary }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const action = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        await updateEpkSettings(fd)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <p className="text-eyebrow text-primary">EPK settings</p>
          <p className="text-sm text-muted-foreground">Brand name, tagline, theme colors.</p>
        </div>
        <span className="text-display text-sm text-muted-foreground">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <form action={action} className="space-y-4 border-t border-border px-5 py-4">
          <input type="hidden" name="epk_id" value={epkId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="display_name">Display name</Label>
              <Input id="display_name" name="display_name" defaultValue={displayName ?? ''} />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" name="tagline" defaultValue={tagline ?? ''} />
            </div>
            <div>
              <Label htmlFor="primary">Primary color</Label>
              <Input id="primary" name="primary" type="color" defaultValue={primary} className="h-10 w-16 p-1" />
            </div>
            <div>
              <Label htmlFor="secondary">Secondary color</Label>
              <Input id="secondary" name="secondary" type="color" defaultValue={secondary} className="h-10 w-16 p-1" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save settings'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
