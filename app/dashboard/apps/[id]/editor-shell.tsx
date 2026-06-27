'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Full-page editor chrome used by the Screens / News / Events / Shop editors —
 * a back header, the form body, and a sticky Save/Cancel footer. Mirrors the
 * legacy App Builder's dedicated editor views.
 */
export function EditorShell({
  title,
  icon,
  backLabel = '← Back',
  saveLabel = 'Save Changes',
  onBack,
  onSave,
  children,
}: {
  title: string
  icon?: ReactNode
  backLabel?: string
  saveLabel?: string
  onBack: () => void
  onSave: () => void
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-panel"
        >
          {backLabel}
        </button>
        {icon && <span className="text-2xl">{icon}</span>}
        <h1 className="text-display text-2xl font-black tracking-tight">{title}</h1>
      </div>

      <div className="space-y-4">{children}</div>

      <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-border bg-background/95 py-3 backdrop-blur">
        <Button onClick={onSave}>{saveLabel}</Button>
        <Button variant="ghost" onClick={onBack}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
