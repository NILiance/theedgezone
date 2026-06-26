'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EPK_TEMPLATES } from '@/lib/epk-templates'
import { applyEpkTemplate } from '../actions'

export function EpkTemplatePicker({
  epkId,
  current,
}: {
  epkId: string
  current: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const apply = (id: string) => {
    if (!confirm('Apply this template? It replaces your current blocks + theme.')) return
    setBusy(id)
    setMsg(null)
    startTransition(async () => {
      const res = await applyEpkTemplate(epkId, id)
      setBusy(null)
      if (res.ok) {
        setOpen(false)
        router.refresh()
      } else {
        setMsg(res.message ?? 'Failed')
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
          <p className="text-eyebrow text-primary">Templates</p>
          <p className="text-sm text-muted-foreground">
            Start from a designed layout{current ? ` · current: ${current}` : ''}.
          </p>
        </div>
        <span className="text-display text-sm text-muted-foreground">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="border-t border-border p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EPK_TEMPLATES.map((t) => (
              <div key={t.id} className="rounded-[var(--radius-sm)] border border-border bg-panel/40 p-3">
                <div
                  className="mb-2 flex h-12 items-center justify-center rounded text-xs font-bold"
                  style={{
                    background: t.theme.secondary,
                    color: t.theme.primary,
                    border: `1px solid ${t.theme.primary}`,
                  }}
                >
                  Aa
                </div>
                <p className="text-display text-sm font-bold">{t.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t.desc}</p>
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  disabled={isPending}
                  onClick={() => apply(t.id)}
                >
                  {busy === t.id ? 'Applying…' : current === t.id ? 'Re-apply' : 'Apply'}
                </Button>
              </div>
            ))}
          </div>
          {msg && <p className="mt-2 text-xs text-destructive">{msg}</p>}
        </div>
      )}
    </div>
  )
}
