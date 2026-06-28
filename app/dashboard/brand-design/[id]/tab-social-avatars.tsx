'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DownloadLink } from '@/components/download-link'
import { ARSENAL_EFFECTS } from '@/lib/arsenal-tab-options'
import {
  generateSocialAvatarsAction,
  type SocialAvatarsActionState,
} from './arsenal-tab-actions'

const PLATFORMS = [
  { name: 'Instagram', size: '320×320' },
  { name: 'TikTok', size: '200×200' },
  { name: 'YouTube', size: '800×800' },
  { name: 'X / Twitter', size: '400×400' },
  { name: 'Facebook', size: '320×320' },
  { name: 'LinkedIn', size: '400×400' },
]

export function SocialAvatarsTab({ brandId, hasFinal }: { brandId: string; hasFinal: boolean }) {
  const [state, action, pending] = useActionState<SocialAvatarsActionState, FormData>(
    generateSocialAvatarsAction,
    {}
  )
  const [effect, setEffect] = useState('none')
  useRefreshOnNewUrl(state.url)

  if (!hasFinal) return <LockedNotice label="Social Avatars" />

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Social Media Avatars</h2>
      <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted-foreground">
        Download your logo perfectly sized for every platform. Each avatar is cropped and
        optimized for the platform&rsquo;s profile picture requirements.
      </p>

      <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-3">
        {PLATFORMS.map((p) => (
          <div
            key={p.name}
            className="rounded-[var(--radius-sm)] border border-border bg-panel/40 p-3 text-center"
          >
            <p className="text-display text-xs font-bold">{p.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {p.size}
            </p>
          </div>
        ))}
      </div>

      <form action={action} className="mx-auto mt-6 flex max-w-sm flex-col items-center gap-3">
        <input type="hidden" name="brand_id" value={brandId} />
        <input type="hidden" name="effect" value={effect} />
        <label className="block w-full">
          <span className="text-display block text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Background Effect
          </span>
          <select
            value={effect}
            onChange={(e) => setEffect(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {ARSENAL_EFFECTS.map((eff) => (
              <option key={eff.val} value={eff.val}>
                {eff.name}
              </option>
            ))}
          </select>
          {effect !== 'none' && (
            <span className="mt-1 block text-center text-[10px] text-muted-foreground">
              Generates a branded effect backdrop behind your logo.
            </span>
          )}
        </label>
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Generating Pack…' : 'Generate All Avatars'}
        </button>
      </form>

      {state.url && (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-[var(--radius)] border border-success/40 bg-success/5 p-5 text-center">
          <p className="text-display text-sm font-bold text-success">✓ Pack ready</p>
          <DownloadLink
            url={state.url}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            ⬇ Download ZIP ({state.count ?? 0} files)
          </DownloadLink>
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
