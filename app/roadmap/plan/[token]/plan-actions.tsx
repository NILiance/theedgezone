'use client'

import { useState, useTransition } from 'react'
import { emailRoadmapPlan } from '@/app/dashboard/roadmap/build/actions'

export function PlanActions({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setMsg('Link copied.')
    } catch {
      setMsg('Could not copy.')
    }
  }
  const email = () => {
    setMsg(null)
    startTransition(async () => {
      const res = await emailRoadmapPlan(token, window.location.origin)
      setMsg(res.ok ? 'Sent to your email.' : res.message ?? 'Could not send.')
    })
  }

  const btn =
    'text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-panel'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} className={btn}>
        Copy link
      </button>
      <button type="button" onClick={() => window.print()} className={btn}>
        Print / PDF
      </button>
      <button type="button" onClick={email} disabled={isPending} className={btn}>
        {isPending ? 'Sending…' : 'Email me this'}
      </button>
      {msg && <span className="text-[11px] text-muted-foreground">{msg}</span>}
    </div>
  )
}
