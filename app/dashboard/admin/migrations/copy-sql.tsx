'use client'

import { useState } from 'react'

/**
 * Renders a migration's SQL in a scrollable block with a Copy button.
 * Used on the Migrations dashboard so an admin can paste pending
 * migrations straight into the Supabase SQL editor.
 */
export function CopySql({ sql, label }: { sql: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — user can still select the text manually */
    }
  }

  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label ?? 'SQL'}
        </span>
        <button
          type="button"
          onClick={copy}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-panel"
        >
          {copied ? '✓ Copied' : '📋 Copy SQL'}
        </button>
      </div>
      <pre className="max-h-72 overflow-auto p-3 text-[11px] leading-relaxed text-muted-foreground">
        {sql}
      </pre>
    </div>
  )
}
