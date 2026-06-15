'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateLogoAnimationAction,
  type LogoAnimationActionState,
} from './arsenal-tab-actions'
import { LOGO_ANIMATION_STYLE_OPTIONS } from '@/lib/brand-addons'

export function LogoAnimationTab({ brandId, hasFinal }: { brandId: string; hasFinal: boolean }) {
  const [state, action, pending] = useActionState<LogoAnimationActionState, FormData>(
    generateLogoAnimationAction,
    {}
  )
  const [style, setStyle] = useState('zoom')
  const [duration, setDuration] = useState(1600)
  const [loop, setLoop] = useState(false)
  useRefreshOnNewUrl(state.url)

  if (!hasFinal) {
    return <LockedNotice label="Logo Animation" />
  }

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Animated Logo Reveal</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
        Create a smooth CSS animation of your logo. Choose a style, click Generate, and open the
        result in a new tab. Screen-record it to create a video, or share the HTML file directly.
      </p>

      <form
        action={action}
        className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
      >
        <input type="hidden" name="brand_id" value={brandId} />
        <input type="hidden" name="duration_ms" value={duration} />
        {loop && <input type="hidden" name="loop" value="1" />}
        <label className="block min-w-[200px]">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Style
          </span>
          <select
            name="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {LOGO_ANIMATION_STYLE_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[160px]">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Duration ({duration}ms)
          </span>
          <input
            type="range"
            min={300}
            max={5000}
            step={100}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-3 w-full"
          />
        </label>
        <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground sm:mt-6">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
            className="h-4 w-4"
          />
          Loop
        </label>
        <button
          type="submit"
          disabled={pending}
          className="text-display mt-1 rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50 sm:mt-6"
        >
          {pending ? 'Generating…' : 'Generate Animation'}
        </button>
      </form>

      {state.url && (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-[var(--radius)] border border-success/40 bg-success/5 p-5 text-center">
          <p className="text-display text-sm font-bold text-success">✓ Animation ready</p>
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Open in new tab →
          </a>
          <p className="text-[10px] text-muted-foreground">
            The new tile is also in Your Creations below.
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
