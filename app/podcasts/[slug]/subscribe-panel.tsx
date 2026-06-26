'use client'

import { useState, useTransition } from 'react'
import { subscribeToPodcast } from './subscribe-actions'

export function SubscribePanel({
  podcastId,
  priceCents,
  primary,
  secondary,
}: {
  podcastId: string
  priceCents: number
  primary: string
  secondary: string
}) {
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const go = () => {
    setMsg(null)
    startTransition(async () => {
      const res = await subscribeToPodcast({ podcast_id: podcastId, email })
      if (res.ok && res.url) window.location.href = res.url
      else setMsg(res.message ?? 'Could not start checkout.')
    })
  }

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: primary, background: 'rgba(255,255,255,0.04)' }}
    >
      <p className="text-display text-lg font-black" style={{ color: primary }}>
        Premium · ${(priceCents / 100).toFixed(2)}/mo
      </p>
      <p className="mt-1 text-sm text-white/70">
        Subscribe to unlock premium episodes in your favorite podcast app via a private feed.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-white placeholder:text-white/40"
        />
        <button
          type="button"
          onClick={go}
          disabled={isPending || !email}
          className="rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          style={{ background: primary, color: secondary }}
        >
          {isPending ? 'Starting…' : 'Subscribe'}
        </button>
      </div>
      {msg && <p className="mt-2 text-[11px] text-white/60">{msg}</p>}
    </div>
  )
}
