'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  /** Server action accepting FormData with `from_profile` = 'yes' | 'no'. */
  action: (formData: FormData) => Promise<void> | void
  /** What we'll be building. Used in copy. */
  what: string
  /** What sections of the profile inform this build (shown in helper text). */
  profileSections: string[]
  /** Override the trigger button text. */
  triggerLabel?: string
  triggerSize?: 'sm' | 'default' | 'lg'
}

/**
 * Two-mode launcher for any provisioned product. Shows a modal that lets
 * the user pick "Build From My Profile (recommended)" or "Start From
 * Scratch", then submits a server action with from_profile=yes|no.
 */
export function BuildFromPicker({
  action,
  what,
  profileSections,
  triggerLabel,
  triggerSize = 'lg',
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const submit = (fromProfile: boolean) => {
    const fd = new FormData()
    fd.set('from_profile', fromProfile ? 'yes' : 'no')
    startTransition(async () => {
      await action(fd)
    })
  }

  return (
    <>
      <Button
        type="button"
        size={triggerSize}
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        {triggerLabel ?? `+ Start new ${what.toLowerCase()}`}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[var(--radius)] border border-border bg-background p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-eyebrow text-primary">New {what.toLowerCase()}</p>
            <h2 className="text-display mt-2 text-2xl font-black tracking-tight">
              How do you want to start?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Build it from your profile so it&apos;s ready to publish in a couple clicks, or
              start with a blank slate and customize every detail yourself.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={pending}
                className="group flex flex-col gap-2 rounded-[var(--radius)] border-2 border-primary bg-primary/5 p-5 text-left transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                <span className="text-display rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground w-fit">
                  Recommended
                </span>
                <p className="text-display text-lg font-black">Build from my profile</p>
                <p className="text-sm text-muted-foreground">
                  We pre-fill from your{' '}
                  {profileSections.map((s, i) => (
                    <span key={s}>
                      <span className="font-semibold text-foreground">{s}</span>
                      {i < profileSections.length - 1 ? (i === profileSections.length - 2 ? ', and ' : ', ') : ''}
                    </span>
                  ))}{' '}
                  so you can edit copy + visuals instead of typing everything from zero.
                </p>
              </button>

              <button
                type="button"
                onClick={() => submit(false)}
                disabled={pending}
                className="flex flex-col gap-2 rounded-[var(--radius)] border-2 border-border bg-panel/40 p-5 text-left transition-colors hover:bg-panel/60 disabled:opacity-50"
              >
                <span className="text-display rounded-full bg-panel-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-fit">
                  Blank
                </span>
                <p className="text-display text-lg font-black">Start from scratch</p>
                <p className="text-sm text-muted-foreground">
                  Empty template — bring your own copy, colors, and images. Best when you want
                  total creative control.
                </p>
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              {pending && <p className="text-xs text-muted-foreground">Creating…</p>}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Either way you can switch blocks, add pages, and re-style at any time.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
