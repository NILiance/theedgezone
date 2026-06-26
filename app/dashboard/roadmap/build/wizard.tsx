'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/services-data'
import { generateRoadmapPlan } from './actions'

const GOALS = [
  'Land brand deals',
  'Grow my audience',
  'Build my online presence',
  'Make passive income',
  'Sell merch',
  'Protect my NIL legally',
  'Get financially smart',
  'Go pro / draft prep',
  'Plan life after sports',
  'Create content like a pro',
]

const BUDGETS: { label: string; value: number }[] = [
  { label: 'Under $50 / mo', value: 50 },
  { label: '$50 – $150 / mo', value: 150 },
  { label: '$150 – $500 / mo', value: 500 },
  { label: '$500+ / mo (no limit)', value: 0 },
]

const TIMELINES = ['1 month', '3 months', '6 months', '12 months']

const STEPS = ['Goals', 'Focus', 'Budget', 'Timeline', 'Social', 'Review']

export function RoadmapWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [goals, setGoals] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [budget, setBudget] = useState<number>(150)
  const [timeline, setTimeline] = useState<string>('3 months')
  const [followers, setFollowers] = useState<number>(0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])

  const canNext =
    (step === 0 && goals.length > 0) ||
    (step === 1 && categories.length > 0) ||
    step >= 2

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await generateRoadmapPlan({ goals, categories, budget, timeline, followers })
      if (res.ok && res.token) router.push(`/roadmap/plan/${res.token}`)
      else setError(res.message ?? 'Could not build your roadmap.')
    })
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
      active
        ? 'border-primary bg-primary/15 text-primary'
        : 'border-border bg-panel/40 text-muted-foreground hover:border-primary/40'
    }`

  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      {/* Stepper */}
      <div className="mb-5 flex flex-wrap items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <span
              className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                i === step
                  ? 'bg-primary text-primary-foreground'
                  : i < step
                  ? 'bg-success/20 text-success'
                  : 'bg-panel-elevated text-muted-foreground'
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="text-muted-foreground/40">·</span>}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <p className="text-display font-bold">What are your goals?</p>
          <p className="mb-3 text-xs text-muted-foreground">Pick all that apply.</p>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button key={g} type="button" onClick={() => toggle(goals, setGoals, g)} className={chip(goals.includes(g))}>
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="text-display font-bold">Where do you want to focus?</p>
          <p className="mb-3 text-xs text-muted-foreground">We&apos;ll weight recommendations here.</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => toggle(categories, setCategories, c.key)}
                className={chip(categories.includes(c.key))}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-display font-bold">What&apos;s your monthly budget?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {BUDGETS.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => setBudget(b.value)}
                className={`rounded-[var(--radius-sm)] border p-3 text-left text-sm ${
                  budget === b.value ? 'border-primary bg-primary/10' : 'border-border bg-panel/40'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="text-display font-bold">What&apos;s your timeline?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TIMELINES.map((t) => (
              <button key={t} type="button" onClick={() => setTimeline(t)} className={chip(timeline === t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <p className="text-display font-bold">Total social following</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Across all platforms — used for your readiness score.
          </p>
          <input
            type="number"
            min={0}
            value={followers || ''}
            onChange={(e) => setFollowers(Math.max(0, Number(e.target.value) || 0))}
            placeholder="e.g. 12500"
            className="w-full max-w-xs rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-2 text-sm">
          <p className="text-display font-bold">Review</p>
          <p><span className="text-muted-foreground">Goals:</span> {goals.join(', ') || '—'}</p>
          <p>
            <span className="text-muted-foreground">Focus:</span>{' '}
            {categories.map((k) => CATEGORIES.find((c) => c.key === k)?.label ?? k).join(', ') || '—'}
          </p>
          <p><span className="text-muted-foreground">Budget:</span> {BUDGETS.find((b) => b.value === budget)?.label}</p>
          <p><span className="text-muted-foreground">Timeline:</span> {timeline}</p>
          <p><span className="text-muted-foreground">Following:</span> {followers.toLocaleString()}</p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || isPending}>
          ← Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Next →
          </Button>
        ) : (
          <Button onClick={submit} disabled={isPending}>
            {isPending ? 'Building…' : 'Build my roadmap'}
          </Button>
        )}
      </div>
    </div>
  )
}
