'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adminSyncNiliance } from './actions'

/** Per-row "Sync from NILiance" button in the admin NILiance table. */
export function SyncButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const onClick = () => {
    setMsg(null)
    start(async () => {
      const res = await adminSyncNiliance(userId)
      setMsg({ ok: res.ok, text: res.message })
      if (res.ok) router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-display rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 disabled:opacity-50"
      >
        {pending ? 'Syncing…' : '↓ Sync'}
      </button>
      {msg && (
        <span className={`text-[10px] ${msg.ok ? 'text-success' : 'text-destructive'}`}>
          {msg.text}
        </span>
      )}
    </div>
  )
}
