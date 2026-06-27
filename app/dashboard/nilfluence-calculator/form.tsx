'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import {
  computeNilfluence,
  computeBMS,
  type NilfluenceResult,
  type PlatformInput,
} from '@/lib/nilfluence'
import type { AutoPopularity } from '@/lib/nilfluence-autocalc'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { Button } from '@/components/ui/button'
import { runCalculator, type CalcState } from './actions'
import { aiPopularity } from './ai-actions'

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

interface SavedPlatform {
  followers?: number
  likes_per_post?: number
  comments_per_post?: number
  shares_per_post?: number
}

interface FormProps {
  lastInputs: Record<string, unknown> | null
  lastBms: Record<string, unknown> | null
  autoPopularity: AutoPopularity
  /** Auto-refine the four contextual inputs on load (when not already saved). */
  autoCalc: boolean
  /** Social numbers resolved Phyllo-first then from Profile→Social, to seed. */
  seedSocial: Record<string, PlatformInput>
}

export function CalculatorForm({
  lastInputs,
  lastBms,
  autoPopularity,
  autoCalc,
  seedSocial,
}: FormProps) {
  const [state, action, pending] = useActionState<CalcState, FormData>(runCalculator, {})

  const initial = useMemo<Record<string, number>>(() => {
    const platforms = (lastInputs ?? {}) as Record<string, SavedPlatform>
    const li = lastInputs as Record<string, unknown> | null
    const bms = lastBms as Record<string, number> | null
    // Social: prefer the resolved Phyllo → Profile→Social numbers, then the
    // last saved calculation, then 0.
    const seed = (p: string): PlatformInput =>
      seedSocial[p] ?? {
        followers: 0,
        likes_per_post: 0,
        comments_per_post: 0,
        shares_per_post: 0,
      }
    return {
      ig_followers: seed('instagram').followers || platforms.instagram?.followers || 0,
      ig_likes: seed('instagram').likes_per_post || platforms.instagram?.likes_per_post || 0,
      ig_comments: seed('instagram').comments_per_post || platforms.instagram?.comments_per_post || 0,
      ig_shares: seed('instagram').shares_per_post || platforms.instagram?.shares_per_post || 0,
      tt_followers: seed('tiktok').followers || platforms.tiktok?.followers || 0,
      tt_likes: seed('tiktok').likes_per_post || platforms.tiktok?.likes_per_post || 0,
      tt_comments: seed('tiktok').comments_per_post || platforms.tiktok?.comments_per_post || 0,
      tt_shares: seed('tiktok').shares_per_post || platforms.tiktok?.shares_per_post || 0,
      tw_followers: seed('twitter').followers || platforms.twitter?.followers || 0,
      tw_likes: seed('twitter').likes_per_post || platforms.twitter?.likes_per_post || 0,
      tw_comments: seed('twitter').comments_per_post || platforms.twitter?.comments_per_post || 0,
      tw_shares: seed('twitter').shares_per_post || platforms.twitter?.shares_per_post || 0,
      yt_subscribers: seed('youtube').followers || platforms.youtube?.followers || 0,
      yt_likes: seed('youtube').likes_per_post || platforms.youtube?.likes_per_post || 0,
      yt_comments: seed('youtube').comments_per_post || platforms.youtube?.comments_per_post || 0,
      yt_shares: seed('youtube').shares_per_post || platforms.youtube?.shares_per_post || 0,
      // Popularity + adjustment always re-derive from the CURRENT profile (so
      // changing team / position / market refreshes them); the on-load estimate
      // then refines them. We intentionally do NOT restore these from the last
      // saved calculation — otherwise stale values would stick.
      athlete_popularity: autoPopularity.athlete,
      team_popularity: autoPopularity.team,
      market_size: autoPopularity.market,
      adjustment_factor: autoPopularity.adjustment,
      // Monetization inputs (spreadsheet B32 / B34). Defaults mirror the sheet.
      profit_per_product: (li?.['profit_per_product'] as number | undefined) ?? 45,
      purchase_conversion_rate:
        ((li?.['purchase_conversion_rate'] as number | undefined) ?? 0.05) * 100,
      bms_i: bms?.i ?? 0,
      bms_d: bms?.d ?? 0,
      bms_o: bms?.o ?? 0,
    }
  }, [lastInputs, lastBms, autoPopularity, seedSocial])

  const [snapshot, setSnapshot] = useState<Record<string, number>>(initial)

  // Refine the four contextual inputs from the profile, silently, on load.
  const [estimating, setEstimating] = useState(false)
  const ranRef = useRef(false)
  useEffect(() => {
    if (!autoCalc || ranRef.current) return
    ranRef.current = true
    setEstimating(true)
    aiPopularity()
      .then((r) => {
        if (r.ok) {
          setSnapshot((prev) => ({
            ...prev,
            athlete_popularity: r.athlete_popularity ?? prev.athlete_popularity,
            team_popularity: r.team_popularity ?? prev.team_popularity,
            market_size: r.market_size ?? prev.market_size,
            adjustment_factor: r.adjustment_factor ?? prev.adjustment_factor,
          }))
        }
      })
      .catch(() => {})
      .finally(() => setEstimating(false))
  }, [autoCalc])

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
      purchase_conversion_rate: (get('purchase_conversion_rate') || 0) / 100 || undefined,
    })
    const bms = computeBMS({ i: get('bms_i'), d: get('bms_d'), o: get('bms_o') })
    return { result, bms }
  }, [snapshot])

  const update = (name: string, value: string) => {
    const n = Number(value)
    setSnapshot((prev) => ({ ...prev, [name]: Number.isFinite(n) ? n : 0 }))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form action={action} className="space-y-6">
          {/* Social platforms — "API" rows on the spreadsheet */}
          <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-eyebrow text-primary">Social numbers</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Per-post averages over the last ~30 days work best.
                </p>
              </div>
              <PullFromPhylloButton
                onPulled={(pulled) => setSnapshot((prev) => ({ ...prev, ...pulled }))}
              />
            </div>
            <div className="mt-4 space-y-4">
              {PLATFORMS.map((p) => {
                const er = liveResult.result.per_platform[platformKey(p.key)].engagement_rate
                return (
                  <div
                    key={p.key}
                    className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <p className="text-display text-sm font-bold">{p.label}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Engagement {(er * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <FieldNumber
                        name={FOLLOWER_FIELD[p.key]}
                        label={p.followerLabel}
                        value={snapshot[FOLLOWER_FIELD[p.key]] ?? 0}
                        onChange={update}
                      />
                      <FieldNumber
                        name={`${p.key}_likes`}
                        label="Likes / post"
                        value={snapshot[`${p.key}_likes`] ?? 0}
                        onChange={update}
                      />
                      <FieldNumber
                        name={`${p.key}_comments`}
                        label="Comments / post"
                        value={snapshot[`${p.key}_comments`] ?? 0}
                        onChange={update}
                      />
                      <FieldNumber
                        name={`${p.key}_shares`}
                        label="Shares / post"
                        value={snapshot[`${p.key}_shares`] ?? 0}
                        onChange={update}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Popularity + adjustment — auto-estimated from the profile */}
          <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-eyebrow text-primary">Popularity inputs</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Estimated from your profile. Override any value if you know better.
                </p>
              </div>
              {estimating && (
                <span className="text-display animate-pulse text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Estimating…
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FieldNumber
                name="athlete_popularity"
                label="Athlete popularity (0–100)"
                value={snapshot.athlete_popularity ?? 0}
                onChange={update}
              />
              <FieldNumber
                name="team_popularity"
                label="Team popularity (0–100)"
                value={snapshot.team_popularity ?? 0}
                onChange={update}
              />
              <FieldNumber
                name="market_size"
                label="Market size (0–100)"
                value={snapshot.market_size ?? 0}
                onChange={update}
              />
              <FieldNumber
                name="adjustment_factor"
                label="Adjustment factor (0–48)"
                value={snapshot.adjustment_factor ?? 0}
                onChange={update}
              />
            </div>
          </section>

          {/* Brand ROI — spreadsheet monetization block. Enter two inputs;
              post value, break-even, revenue, and ROI compute below. */}
          <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
            <p className="text-eyebrow text-primary">Brand ROI (optional)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter your profit per product and the estimated purchase rate of total engagements —
              post value, break-even, revenue, and ROI calculate in the breakdown below.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FieldNumber
                name="profit_per_product"
                label="Profit per product sold ($)"
                value={snapshot.profit_per_product ?? 0}
                onChange={update}
              />
              <FieldNumber
                name="purchase_conversion_rate"
                label="Purchase rate (% of total engagements)"
                value={snapshot.purchase_conversion_rate ?? 0}
                step={0.5}
                onChange={update}
              />
            </div>
          </section>

          {/* Brand Match Score */}
          <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
            <p className="text-eyebrow text-primary">Brand Match (optional)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Score a hypothetical brand pairing on industry fit, demographic match, and objective
              match (0–2 each).
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <FieldNumber
                name="bms_i"
                label="Industry fit (I)"
                value={snapshot.bms_i ?? 0}
                step={0.5}
                onChange={update}
              />
              <FieldNumber
                name="bms_d"
                label="Demographic match (D)"
                value={snapshot.bms_d ?? 0}
                step={0.5}
                onChange={update}
              />
              <FieldNumber
                name="bms_o"
                label="Objective match (O)"
                value={snapshot.bms_o ?? 0}
                step={0.5}
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
              {state.syncError && (
                <span className="text-destructive"> · NILiance sync failed: {state.syncError}</span>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Calculating…' : 'Calculate & save'}
          </button>
        </form>

        {/* Live preview */}
        <aside className="space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="flex flex-col items-center rounded-[var(--radius)] border border-border bg-panel/40 p-5 shadow-elevated">
              <ScoreRing score={liveResult.result.nilfluence_score} size={200} label="NILfluence" />
              <div className="mt-3 grid w-full grid-cols-2 gap-2 text-center text-xs">
                <Stat label="Reach" value={liveResult.result.total_followers.toLocaleString()} />
                <Stat
                  label="Engagement"
                  value={`${(liveResult.result.total_engagement_rate * 100).toFixed(2)}%`}
                />
                <div className="col-span-2">
                  <Stat
                    label="Approx. post value"
                    value={`$${liveResult.result.approximate_post_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    accent
                  />
                </div>
              </div>
            </div>
            {(snapshot.bms_i > 0 || snapshot.bms_d > 0 || snapshot.bms_o > 0) && (
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
          </div>
        </aside>
      </div>

      {/* Full breakdown — every row from the NILfluence Score tab */}
      <FullBreakdown result={liveResult.result} score={liveResult.result.nilfluence_score} />
    </div>
  )
}

function platformKey(k: 'ig' | 'tt' | 'tw' | 'yt'): keyof NilfluenceResult['per_platform'] {
  return ({ ig: 'instagram', tt: 'tiktok', tw: 'twitter', yt: 'youtube' } as const)[k]
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-2">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-display mt-1 font-bold ${accent ? 'text-primary' : ''}`}>{value}</p>
    </div>
  )
}

// ── Full breakdown table (mirrors the spreadsheet's NILfluence Score tab) ────

function FullBreakdown({ result, score }: { result: NilfluenceResult; score: number }) {
  const n = (v: number, d = 0) => v.toLocaleString(undefined, { maximumFractionDigits: d })
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`
  const usd = (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const m = result.monetization
  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <p className="text-eyebrow text-primary">Full breakdown</p>
      <p className="mt-1 text-xs text-muted-foreground">Your complete NILfluence breakdown.</p>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        {/* Reach + engagement per platform */}
        <div>
          <p className="text-display mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Per platform
          </p>
          <Table
            rows={[
              ['Instagram followers', n(result.per_platform.instagram.followers)],
              ['IG engagement rate', pct(result.per_platform.instagram.engagement_rate)],
              ['TikTok followers', n(result.per_platform.tiktok.followers)],
              ['TikTok engagement rate', pct(result.per_platform.tiktok.engagement_rate)],
              ['Twitter followers', n(result.per_platform.twitter.followers)],
              ['Twitter engagement rate', pct(result.per_platform.twitter.engagement_rate)],
              ['YouTube subscribers', n(result.per_platform.youtube.followers)],
              ['YouTube engagement rate', pct(result.per_platform.youtube.engagement_rate)],
            ]}
          />
        </div>

        {/* Totals */}
        <div>
          <p className="text-display mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Total engagement
          </p>
          <Table
            rows={[
              ['Total followers', n(result.total_followers)],
              ['Total likes / post', n(result.total_likes_per_post)],
              ['Total comments / post', n(result.total_comments_per_post)],
              ['Total shares / post', n(result.total_shares_per_post)],
              ['Total engagements / post', n(result.total_engagements_per_post)],
              ['Total engagement rate', pct(result.total_engagement_rate)],
              ['NILfluence Score', score.toFixed(2)],
            ]}
            highlightLast
          />
        </div>

        {/* Brand ROI */}
        <div>
          <p className="text-display mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Brand ROI
          </p>
          {m ? (
            <>
              <Table
                rows={[
                  ['Approx. post value', usd(result.approximate_post_value)],
                  ['Profit per product', usd(m.profit_per_product)],
                  ['Products to break even', n(m.products_to_breakeven, 1)],
                  ['Est. products sold', n(m.estimated_products_sold, 0)],
                  ['Projected revenue', usd(m.revenue)],
                  ['Projected profit', usd(m.revenue - result.approximate_post_value)],
                  ['ROI (margin)', pct(m.roi)],
                ]}
                highlightLast
              />
              <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                Approx. post value is based on an industry average of $10 per 1,000 followers at 1%
                engagement.
              </p>
            </>
          ) : (
            <p className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-3 text-xs text-muted-foreground">
              Enter a profit per product above to project break-even, revenue, and ROI.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function Table({
  rows,
  highlightLast,
}: {
  rows: Array<[string, string]>
  highlightLast?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-sm)] border border-border">
      {rows.map(([label, value], i) => {
        const last = highlightLast && i === rows.length - 1
        return (
          <div
            key={label}
            className={`flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-xs last:border-b-0 ${
              last ? 'bg-primary/10' : i % 2 ? 'bg-background/20' : ''
            }`}
          >
            <span className="text-muted-foreground">{label}</span>
            <span className={`text-display font-bold ${last ? 'text-primary' : ''}`}>{value}</span>
          </div>
        )
      })}
    </div>
  )
}

function PullFromPhylloButton({ onPulled }: { onPulled: (snap: Record<string, number>) => void }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pulled, setPulled] = useState<number | null>(null)

  const pull = async () => {
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/phyllo/sync', { method: 'POST' })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const { synced } = (await res.json()) as { synced: number }
      setPulled(synced)
      const statsRes = await fetch('/api/phyllo/sync/latest')
      if (statsRes.ok) {
        const stats = (await statsRes.json()) as {
          platforms: Record<
            string,
            { followers?: number; avg_likes?: number; avg_comments?: number; avg_shares?: number }
          >
        }
        const update: Record<string, number> = {}
        if (stats.platforms.instagram) {
          update.ig_followers = stats.platforms.instagram.followers ?? 0
          update.ig_likes = stats.platforms.instagram.avg_likes ?? 0
          update.ig_comments = stats.platforms.instagram.avg_comments ?? 0
          update.ig_shares = stats.platforms.instagram.avg_shares ?? 0
        }
        if (stats.platforms.tiktok) {
          update.tt_followers = stats.platforms.tiktok.followers ?? 0
          update.tt_likes = stats.platforms.tiktok.avg_likes ?? 0
          update.tt_comments = stats.platforms.tiktok.avg_comments ?? 0
          update.tt_shares = stats.platforms.tiktok.avg_shares ?? 0
        }
        if (stats.platforms.twitter) {
          update.tw_followers = stats.platforms.twitter.followers ?? 0
          update.tw_likes = stats.platforms.twitter.avg_likes ?? 0
          update.tw_comments = stats.platforms.twitter.avg_comments ?? 0
          update.tw_shares = stats.platforms.twitter.avg_shares ?? 0
        }
        if (stats.platforms.youtube) {
          update.yt_subscribers = stats.platforms.youtube.followers ?? 0
          update.yt_likes = stats.platforms.youtube.avg_likes ?? 0
          update.yt_comments = stats.platforms.youtube.avg_comments ?? 0
          update.yt_shares = stats.platforms.youtube.avg_shares ?? 0
        }
        onPulled(update)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pull failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" variant="outline" onClick={pull} disabled={pending}>
        {pending ? 'Pulling…' : '↻ Pull from Phyllo'}
      </Button>
      {pulled != null && !error && (
        <p className="text-[10px] text-success">Pulled {pulled} platform{pulled === 1 ? '' : 's'}</p>
      )}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  )
}

function FieldNumber({
  name,
  label,
  hint,
  step,
  value,
  onChange,
}: {
  name: string
  label: string
  hint?: string
  step?: number
  value: number
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
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
      />
      {hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  )
}
