'use client'

import { useActionState, useMemo, useState } from 'react'
import { computeNilfluence, computeBMS } from '@/lib/nilfluence'
import { runCalculator, type CalcState } from './actions'

const PLATFORMS = [
  { key: 'ig', label: 'Instagram', followerLabel: 'Followers' },
  { key: 'tt', label: 'TikTok', followerLabel: 'Followers' },
  { key: 'tw', label: 'X (Twitter)', followerLabel: 'Followers' },
  { key: 'yt', label: 'YouTube', followerLabel: 'Subscribers' },
] as const

const FOLLOWER_FIELD: Record<(typeof PLATFORMS)[number]['key'], string> = {
  ig: 'ig_followers',
  tt: 'tt_followers',
  tw: 'tw_followers',
  yt: 'yt_subscribers',
}

export function CalculatorForm() {
  const [state, action, pending] = useActionState<CalcState, FormData>(runCalculator, {})
  const [snapshot, setSnapshot] = useState<Record<string, number>>({})

  const liveResult = useMemo(() => {
    const get = (k: string) => snapshot[k] ?? 0
    const result = computeNilfluence({
      instagram: {
        followers: get('ig_followers'),
        likes_per_post: get('ig_likes'),
        comments_per_post: get('ig_comments'),
        shares_per_post: get('ig_shares'),
      },
      tiktok: {
        followers: get('tt_followers'),
        likes_per_post: get('tt_likes'),
        comments_per_post: get('tt_comments'),
        shares_per_post: get('tt_shares'),
      },
      twitter: {
        followers: get('tw_followers'),
        likes_per_post: get('tw_likes'),
        comments_per_post: get('tw_comments'),
        shares_per_post: get('tw_shares'),
      },
      youtube: {
        followers: get('yt_subscribers'),
        likes_per_post: get('yt_likes'),
        comments_per_post: get('yt_comments'),
        shares_per_post: get('yt_shares'),
      },
      athlete_popularity: get('athlete_popularity'),
      team_popularity: get('team_popularity'),
      market_size: get('market_size'),
      adjustment_factor: get('adjustment_factor'),
      profit_per_product: get('profit_per_product') || undefined,
      purchase_conversion_rate:
        get('purchase_conversion_rate') > 0 ? get('purchase_conversion_rate') / 100 : undefined,
    })
    const bms = computeBMS({ i: get('bms_i'), d: get('bms_d'), o: get('bms_o') })
    return { result, bms }
  }, [snapshot])

  const update = (name: string, value: string) => {
    const n = Number(value)
    setSnapshot((prev) => ({ ...prev, [name]: Number.isFinite(n) ? n : 0 }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form action={action} className="space-y-6">
        {/* Social platforms */}
        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
          <p className="text-eyebrow text-primary">Social numbers</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Per-post averages over the last ~30 days work best.
          </p>
          <div className="mt-4 space-y-4">
            {PLATFORMS.map((p) => (
              <div key={p.key} className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-3">
                <p className="text-display text-sm font-bold">{p.label}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <FieldNumber
                    name={FOLLOWER_FIELD[p.key]}
                    label={p.followerLabel}
                    onChange={update}
                  />
                  <FieldNumber name={`${p.key}_likes`} label="Likes / post" onChange={update} />
                  <FieldNumber
                    name={`${p.key}_comments`}
                    label="Comments / post"
                    onChange={update}
                  />
                  <FieldNumber name={`${p.key}_shares`} label="Shares / post" onChange={update} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popularity + adjustment */}
        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
          <p className="text-eyebrow text-primary">Popularity inputs</p>
          <p className="mt-1 text-xs text-muted-foreground">
            All on a 0–100 scale. Don&apos;t guess — leave at 50 for an average baseline.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FieldRange
              name="athlete_popularity"
              label="Athlete popularity"
              hint="Awards, search trends, media presence"
              onChange={update}
              defaultValue={50}
            />
            <FieldRange
              name="team_popularity"
              label="Team popularity"
              hint="Conference, fanbase, TV coverage"
              onChange={update}
              defaultValue={50}
            />
            <FieldRange
              name="market_size"
              label="Market size"
              hint="Local + regional NIL potential"
              onChange={update}
              defaultValue={50}
            />
            <FieldRange
              name="adjustment_factor"
              label="Adjustment factor"
              hint="Brand-friendliness nudge, –48 to +48"
              min={-48}
              max={48}
              defaultValue={0}
              onChange={update}
            />
          </div>
        </section>

        {/* Optional monetization */}
        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
          <p className="text-eyebrow text-primary">Optional: monetization</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FieldNumber
              name="profit_per_product"
              label="Profit / product sold ($)"
              hint="Net margin after COGS"
              onChange={update}
            />
            <FieldNumber
              name="purchase_conversion_rate"
              label="Engagement → purchase rate (%)"
              hint="Industry default is 0.5%"
              step={0.1}
              onChange={update}
            />
          </div>
        </section>

        {/* Brand Match Score */}
        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
          <p className="text-eyebrow text-primary">Brand Match (optional)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Score a hypothetical brand pairing on industry fit, demographic match, and objective
            match. Each is 0–2.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <FieldRange
              name="bms_i"
              label="Industry fit (I)"
              min={0}
              max={2}
              step={0.5}
              defaultValue={0}
              onChange={update}
            />
            <FieldRange
              name="bms_d"
              label="Demographic match (D)"
              min={0}
              max={2}
              step={0.5}
              defaultValue={0}
              onChange={update}
            />
            <FieldRange
              name="bms_o"
              label="Objective match (O)"
              min={0}
              max={2}
              step={0.5}
              defaultValue={0}
              onChange={update}
            />
          </div>
        </section>

        <label className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-panel/30 p-3 text-sm">
          <input type="checkbox" name="send_to_niliance" className="h-4 w-4" />
          <span>
            Send results to NILiance after I calculate (brands see them when matching me to
            opportunities).
          </span>
        </label>

        {state.error && (
          <p className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="rounded-[var(--radius-sm)] border border-success/40 bg-success/5 p-3 text-sm text-success">
            Saved. {state.synced && '✓ Sent to NILiance.'}
            {state.syncError && <span className="text-destructive"> · NILiance sync failed: {state.syncError}</span>}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Calculating…' : 'Calculate'}
        </button>
      </form>

      {/* Live preview */}
      <aside className="space-y-4">
        <div className="sticky top-6 space-y-4">
          <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5 shadow-elevated">
            <p className="text-eyebrow text-primary">NILfluence Score</p>
            <p className="text-display mt-2 text-5xl font-black text-primary">
              {liveResult.result.nilfluence_score.toFixed(1)}
            </p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>
                Total followers:{' '}
                <span className="font-bold text-foreground">
                  {liveResult.result.total_followers.toLocaleString()}
                </span>
              </p>
              <p>
                Engagement rate:{' '}
                <span className="font-bold text-foreground">
                  {(liveResult.result.total_engagement_rate * 100).toFixed(2)}%
                </span>
              </p>
              <p>
                Approx. post value:{' '}
                <span className="font-bold text-foreground">
                  ${liveResult.result.approximate_post_value.toFixed(0)}
                </span>
              </p>
            </div>
          </div>
          {(snapshot.bms_i || snapshot.bms_d || snapshot.bms_o) && (
            <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5 shadow-elevated">
              <p className="text-eyebrow text-accent">Brand Match</p>
              <p className="text-display mt-2 text-3xl font-black text-accent">
                {liveResult.bms.bms_100.toFixed(0)}
              </p>
              <p className="text-display mt-1 text-sm font-bold">
                {liveResult.bms.tier.emoji} {liveResult.bms.tier.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {liveResult.bms.tier.interpretation}
              </p>
            </div>
          )}
          {liveResult.result.monetization && (
            <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5 shadow-elevated">
              <p className="text-eyebrow text-primary">Monetization</p>
              <div className="mt-3 space-y-1 text-xs">
                <p>
                  Break-even:{' '}
                  <span className="text-display font-bold text-foreground">
                    {liveResult.result.monetization.products_to_breakeven.toFixed(0)} units
                  </span>
                </p>
                <p>
                  Est. units sold:{' '}
                  <span className="text-display font-bold text-foreground">
                    {liveResult.result.monetization.estimated_products_sold.toFixed(0)}
                  </span>
                </p>
                <p>
                  Revenue:{' '}
                  <span className="text-display font-bold text-primary">
                    ${liveResult.result.monetization.revenue.toFixed(0)}
                  </span>
                </p>
                <p>
                  ROI:{' '}
                  <span
                    className={`text-display font-bold ${
                      liveResult.result.monetization.roi >= 0
                        ? 'text-success'
                        : 'text-destructive'
                    }`}
                  >
                    {(liveResult.result.monetization.roi * 100).toFixed(0)}%
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

function FieldNumber({
  name,
  label,
  hint,
  step,
  onChange,
}: {
  name: string
  label: string
  hint?: string
  step?: number
  onChange: (name: string, v: string) => void
}) {
  return (
    <label className="block text-xs">
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        name={name}
        min={0}
        step={step ?? 1}
        defaultValue={0}
        onChange={(e) => onChange(name, e.target.value)}
        className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
      />
      {hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

function FieldRange({
  name,
  label,
  hint,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  onChange,
}: {
  name: string
  label: string
  hint?: string
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  onChange: (name: string, v: string) => void
}) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        name={name}
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        onChange={(e) => onChange(name, e.target.value)}
        className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
      />
      {hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  )
}
