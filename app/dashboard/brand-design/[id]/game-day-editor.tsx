'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DownloadLink } from '@/components/download-link'
import { ARSENAL_EFFECTS } from '@/lib/arsenal-tab-options'
import { generateArsenalAsset, type ArsenalGenState } from './arsenal-actions'

const VARIANTS = [
  { val: 'hype', name: 'Hype / Pre-Game' },
  { val: 'matchup', name: 'Matchup vs Opponent' },
  { val: 'countdown', name: 'Countdown / Kickoff' },
  { val: 'score_announcement', name: 'Final Score Template' },
]

const OPPONENT_ICONS = [
  { val: 'shield', name: 'Shield / Crest' },
  { val: 'circle_initial', name: 'Circle + Initial' },
  { val: 'star', name: 'Star' },
  { val: 'mascot', name: 'Mascot Silhouette' },
  { val: 'helmet', name: 'Helmet' },
  { val: 'none', name: 'Plain Circle' },
]

export function GameDayEditor({ brandId, hasFinal }: { brandId: string; hasFinal: boolean }) {
  const [state, action, pending] = useActionState<ArsenalGenState, FormData>(
    generateArsenalAsset,
    {}
  )
  const [variant, setVariant] = useState('hype')
  const [opponent, setOpponent] = useState('')
  const [opponentIcon, setOpponentIcon] = useState('shield')
  const [customText, setCustomText] = useState('')
  const [effect, setEffect] = useState('none')
  const router = useRouter()
  const lastUrl = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (state.url && state.url !== lastUrl.current) {
      lastUrl.current = state.url
      router.refresh()
    }
  }, [state.url, router])

  if (!hasFinal) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
        <p className="text-eyebrow text-accent">🔒 Game Day Locked</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a final logo first — every Arsenal asset is built around it.
        </p>
      </div>
    )
  }

  const isMatchup = variant === 'matchup'
  const inputCls = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
  const labelCls =
    'text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground'

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Game Day</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
        Matchup, countdown, hype and final-score graphics built around your logo. Pick the type, name
        the opponent, add your own headline and an effect.
      </p>

      <form action={action} className="mx-auto mt-6 grid max-w-xl gap-3">
        <input type="hidden" name="brand_id" value={brandId} />
        <input type="hidden" name="category" value="game_day" />
        <input type="hidden" name="option" value={variant} />
        <input type="hidden" name="effect" value={effect} />
        <input type="hidden" name="opponent" value={opponent} />
        <input type="hidden" name="opponent_icon" value={opponentIcon} />
        <input type="hidden" name="custom_text" value={customText} />

        <label className="block">
          <span className={labelCls}>Type</span>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {VARIANTS.map((v) => (
              <option key={v.val} value={v.val}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        {isMatchup && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Opponent name</span>
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="e.g. State"
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Opponent icon</span>
              <select
                value={opponentIcon}
                onChange={(e) => setOpponentIcon(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {OPPONENT_ICONS.map((o) => (
                  <option key={o.val} value={o.val}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <label className="block">
          <span className={labelCls}>Headline text (optional)</span>
          <input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={isMatchup ? 'GAME DAY' : 'e.g. SATURDAY 7PM · HOMECOMING'}
            className={`mt-1 ${inputCls}`}
          />
        </label>

        <label className="block">
          <span className={labelCls}>Visual Effect</span>
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
        </label>

        <button
          type="submit"
          disabled={pending}
          className="text-display mx-auto mt-1 rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Generating…' : 'Generate Game Day Graphic'}
        </button>
        {state.error && <p className="text-center text-xs text-destructive">{state.error}</p>}
        {state.url && (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-success/40 bg-success/5 p-4 text-center">
            <p className="text-display text-sm font-bold text-success">✓ Ready</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.url} alt="Game day graphic" className="max-h-72 w-auto rounded-md border border-border" />
            <DownloadLink
              url={state.url}
              filename="game-day.png"
              className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
            >
              ⬇ Download
            </DownloadLink>
          </div>
        )}
      </form>
    </div>
  )
}
