'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateSiteSettings } from '@/app/dashboard/sites/actions'

interface Props {
  siteId: string
  displayName: string | null
  tagline: string | null
  primary: string
  secondary: string
}

export function SiteSettingsForm({ siteId, displayName, tagline, primary, secondary }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const action = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        await updateSiteSettings(fd)
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
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <p className="text-eyebrow text-primary">Site settings</p>
          <p className="text-sm text-muted-foreground">Brand name, tagline, theme colors.</p>
        </div>
        <span className="text-display text-sm text-muted-foreground">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <form action={action} className="space-y-4 border-t border-border px-5 py-4">
          <input type="hidden" name="site_id" value={siteId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="display_name">Brand / display name</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={displayName ?? ''}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                name="tagline"
                defaultValue={tagline ?? ''}
                placeholder="Forward · Class of 2027"
              />
            </div>
            <div>
              <Label htmlFor="primary">Primary color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  name="primary"
                  type="color"
                  defaultValue={primary}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <Input
                  defaultValue={primary}
                  onChange={(e) => {
                    const el = document.getElementById('primary') as HTMLInputElement | null
                    if (el && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) el.value = e.target.value
                  }}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary">Secondary color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  name="secondary"
                  type="color"
                  defaultValue={secondary}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <Input
                  defaultValue={secondary}
                  onChange={(e) => {
                    const el = document.getElementById('secondary') as HTMLInputElement | null
                    if (el && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) el.value = e.target.value
                  }}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save settings'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
