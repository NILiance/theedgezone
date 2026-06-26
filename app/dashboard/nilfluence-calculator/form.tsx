'use client'

import { useActionState, useMemo, useState } from 'react'
import { computeNilfluence, computeBMS } from '@/lib/nilfluence'
import type { AutoPopularity } from '@/lib/nilfluence-autocalc'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { Button } from '@/components/ui/button'
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
}

export function CalculatorForm({ lastInputs, lastBms, autoPopularity }: FormProps) {
  const [state, action, pending] = useActionState<CalcState, FormData>(runCalculator, {})

  // Initial snapshot pulls from the last saved calculation, falling back to
  // auto-calculated popularity from the profile.
  const initial = useMemo<Record<string, number>>(() => {
    const platforms = (lastInputs ?? {}) as Record<string, SavedPlatform>
    const li = lastInputs as Record<string, unknown> | null
    const bms = lastBms as Record<string, number> | null
    return {
      ig_followers: platforms.instagram?.followers ?? 0,
      ig_likes: platforms.instagram?.likes_per_post ?? 0,
      ig_comments: platforms.instagram?.comments_per_post ?? 0,
      ig_shares: platforms.instagram?.shares_per_post ?? 0,
      tt_followers: platforms.tiktok?.followers ?? 0,
      tt_likes: platforms.tiktok?.likes_per_post ?? 0,
      tt_comments: platforms.tiktok?.comments_per_post ?? 0,
      tt_shares: platforms.tiktok?.shares_per_post ?? 0,
      tw_followers: platforms.twitter?.followers ?? 0,
      tw_likes: platforms.twitter?.likes_per_post ?? 0,
      tw_comments: platforms.twitter?.comments_per_post ?? 0,
      tw_shares: platforms.twitter?.shares_per_post ?? 0,
      yt_subscribers: platforms.youtube?.followers ?? 0,
      yt_likes: platforms.youtube?.likes_per_post ?? 0,
      yt_comments: platforms.youtube?.comments_per_post ?? 0,
      yt_shares: platforms.youtube?.shares_per_post ?? 0,
      athlete_popularity: (li?.['athlete_popularity'] as number | undefined) ?? autoPopularity.athlete,
      team_popularity: (li?.['team_popularity'] as number | undefined) ?? autoPopularity.team,
      market_size: (li?.['market_size'] as number | undefined) ?? autoPopularity.market,
      adjustment_factor: (li?.['adjustment_factor'] as number | undefined) ?? 0,
      bms_i: bms?.i ?? 0,
      bms_d: bms?.d ?? 0,
      bms_o: bms?.o ?? 0,
    }
  }, [lastInputs, lastBms, autoPopularity])

  const [snapshot, setSnapshot] = useState<Record<string, number>>(initial)

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
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-eyebrow text-primary">Social numbers</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Per-post averages over the last ~30 days work best.
              </p>
            </div>
            <PullFromPhylloButton
              onPulled={(pulled) => {
                setSnapshot((prev) => ({ ...prev, ...pulled }))
              }}
            />
          </div>
          <div className="mt-4 space-y-4">
            {PLATFORMS.map((p) => (
              <div
                key={p.key}
                className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-3"
              >
                <p className="text-display text-sm font-bold">{p.label}</p>
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
            ))}
          </div>
        </section>

        {/* Popularity + adjustment */}
        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
          <p className="text-eyebrow text-primary">Popularity inputs</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We pre-fill from your profile. Tweak if you know better than our auto-estimate.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FieldNumber
              name="athlete_popularity"
              label="Athlete popularity"
              value={snapshot.athlete_popularity ?? 0}
              hint={`Auto: ${autoPopularity.athlete} (${autoPopularity.notes.athlete})`}
              onChange={update}
            />
            <FieldNumber
              name="team_popularity"
              label="Team popularity"
              value={snapshot.team_popularity ?? 0}
              hint={`Auto: ${autoPopularity.team} (${autoPopularity.notes.team})`}
              onChange={update}
            />
            <FieldNumber
              name="market_size"
              label="Market size"
              value={snapshot.market_size ?? 0}
              hint={`Auto: ${autoPopularity.market} (${autoPopularity.notes.market})`}
              onChange={update}
            />
            <FieldNumber
              name="adjustment_factor"
              label="Adjustment factor (0 to 48)"
              value={snapshot.adjustment_factor ?? 0}
              hint="Brand-friendliness bonus"
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
              <div className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Reach
                </p>
                <p className="text-display mt-1 font-bold">
                  {liveResult.result.total_followers.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ER</p>
                <p className="text-display mt-1 font-bold">
                  {(liveResult.result.total_engagement_rate * 100).toFixed(2)}%
                </p>
              </div>
              <div className="col-span-2 rounded-[var(--radius-sm)] border border-border bg-background/40 p-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Approx. post value
                </p>
                <p className="text-display mt-1 font-bold text-primary">
                  ${liveResult.result.approximate_post_value.toFixed(0)}
                </p>
              </div>
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
        </div>
      </aside>
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
      // Load the freshly cached stats.
      const statsRes = await fetch('/api/phyllo/sync/latest')
      if (statsRes.ok) {
        const stats = (await statsRes.json()) as {
          platforms: Record<
            string,
            {
              followers?: number
              avg_likes?: number
              avg_comments?: number
              avg_shares?: number
            }
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
