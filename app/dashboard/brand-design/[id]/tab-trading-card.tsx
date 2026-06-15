'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateTradingCardAction,
  type TradingCardActionState,
} from './arsenal-tab-actions'

const STYLES = [
  { value: 'modern', name: 'Modern' },
  { value: 'vintage', name: 'Vintage' },
  { value: 'holographic', name: 'Holographic' },
  { value: 'premium_gold', name: 'Premium Gold' },
]

export function TradingCardTab({ brandId, hasFinal }: { brandId: string; hasFinal: boolean }) {
  const [state, action, pending] = useActionState<TradingCardActionState, FormData>(
    generateTradingCardAction,
    {}
  )
  const [style, setStyle] = useState('modern')
  useRefreshOnNewUrl(state.url)

  if (!hasFinal) return <LockedNotice label="Trading Card" />

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Autograph Trading Card</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
        Upload your best action photo, add optional stats and a tagline, then click Generate to
        preview. Once you love your card, order printed copies below.
      </p>

      <form
        action={action}
        className="mx-auto mt-6 grid max-w-2xl gap-3"
      >
        <input type="hidden" name="brand_id" value={brandId} />
        <label className="block">
          <span className="text-display block text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your Photo (required)
          </span>
          <input
            type="file"
            name="photo"
            accept="image/png,image/jpeg"
            required
            className="mt-1 block w-full rounded-md border border-border bg-panel-elevated px-3 py-2 text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-[var(--radius-sm)] file:border file:border-border file:bg-panel-elevated file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-foreground hover:file:bg-primary hover:file:text-primary-foreground"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="stats"
            placeholder="Key stats (e.g., 1,200 rush yards)"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="tagline"
            placeholder="Tagline (e.g., Built Different)"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <label className="block">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Card Style
          </span>
          <select
            name="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-2 flex justify-center">
          <button
            type="submit"
            disabled={pending}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Generating Preview…' : 'Generate Preview'}
          </button>
        </div>
      </form>

      {state.url && (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-[var(--radius)] border border-success/40 bg-success/5 p-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.url}
            alt="Generated trading card"
            className="max-h-[400px] w-auto rounded-md border border-border"
          />
          <p className="text-[10px] text-muted-foreground">
            Saved to Your Creations below — download or order from there.
          </p>
        </div>
      )}
      {state.error && <p className="mt-4 text-center text-xs text-destructive">{state.error}</p>}
    </div>
  )
}

function LockedNotice({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
      <p className="text-eyebrow text-accent">🔒 {label} Locked</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a final logo first — every Arsenal asset is built around it.
      </p>
    </div>
  )
}

function useRefreshOnNewUrl(url: string | undefined) {
  const router = useRouter()
  const lastRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (url && url !== lastRef.current) {
      lastRef.current = url
      router.refresh()
    }
  }, [url, router])
}
